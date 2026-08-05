const axios = require('axios');
const logger = require('../utils/logger');
const pyodideRunner = require('./pyodideRunner');
const jsRunner = require('./jsRunner');
const { buildStructuredDriverCode, typedCompare } = require('./questionTypeEngine');
const { AppError, BadRequestError } = require('../utils/errors');

const MAX_CODE_LENGTH = 10000;
const MAX_TEST_CASES = 10;
const MAX_INPUT_LENGTH = 500;

const getDriverCode = (language, userCode, testCases) => {
    if (language === 'python') {
        const inputs = testCases.map(tc => tc.input);
        return `
import sys
import io

${userCode}

def driver():
    user_stdout = io.StringIO()
    old_stdout = sys.stdout

    inputs = ${JSON.stringify(inputs)}
    results = []
    for i in inputs:
        sys.stdout = user_stdout
        try:
            if 'solve' not in globals():
                sys.stdout = old_stdout
                results.append("Error: Function 'solve' not found")
                continue

            res = solve(i)
            sys.stdout = old_stdout
            results.append(str(res))
        except Exception as e:
            sys.stdout = old_stdout
            results.append(f"Error: {str(e)}")

    sys.stdout = old_stdout
    print(user_stdout.getvalue(), end="")
    print("===LOGS_DONE===")
    print("|||".join(results))

if __name__ == "__main__":
    driver()
`;
    }

    if (language === 'java') {
        const inputs = testCases.map(tc => tc.input);
        return `
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        String[] inputs = {${inputs.map(i => JSON.stringify(i)).join(',')}};
        List<String> results = new ArrayList<>();

        PrintStream oldOut = System.out;
        ByteArrayOutputStream userOut = new ByteArrayOutputStream();
        PrintStream newOut = new PrintStream(userOut);

        Solution s = new Solution();

        for (String input : inputs) {
            System.setOut(newOut);
            try {
                String res = s.solve(input);
                System.setOut(oldOut);
                results.add(res);
            } catch (Exception e) {
                System.setOut(oldOut);
                results.add("Error: " + e.getMessage());
            }
        }

        System.out.print(userOut.toString());
        System.out.println("===LOGS_DONE===");
        System.out.print(String.join("|||", results));
    }
}

${userCode}
`;
    }

    if (language === 'javascript') {
        const inputs = testCases.map(tc => tc.input);
        return `
${userCode}

const __logs = [];
const __cap = function() {
    var __args = Array.prototype.slice.call(arguments);
    __logs.push(__args.map(function(a) { return typeof a === 'string' ? a : JSON.stringify(a); }).join(' '));
};
var __orig = {};
var __methods = ['log', 'error', 'warn'];
__methods.forEach(function(m) { __orig[m] = console[m]; console[m] = __cap; });

var __inputs = ${JSON.stringify(inputs)};
var __results = [];

for (var __i = 0; __i < __inputs.length; __i++) {
    __methods.forEach(function(m) { console[m] = __cap; });
    try {
        if (typeof solve !== 'function') {
            __methods.forEach(function(m) { console[m] = __orig[m]; });
            __results.push("Error: Function 'solve' not found");
            continue;
        }
        var __res = solve(__inputs[__i]);
        __methods.forEach(function(m) { console[m] = __orig[m]; });
        __results.push(__res === undefined ? 'undefined' : String(__res));
    } catch (__e) {
        __methods.forEach(function(m) { console[m] = __orig[m]; });
        __results.push("Error: " + __e.message);
    }
}

__methods.forEach(function(m) { console[m] = __orig[m]; });
process.stdout.write(__logs.join('\\n'));
console.log("===LOGS_DONE===");
console.log(__results.join("|||"));
`;
    }

    return userCode;
};

const executePiston = async (language, sourceCode) => {
    // The executor must be an explicitly-configured Piston instance. We never
    // fall back to a public service: that would (a) silently leak the user's
    // code AND hidden test cases to a third party, and (b) execute untrusted
    // code outside our control. Use a self-hosted Piston container in prod.
    const pistonUrl = process.env.PISTON_API_URL;
    if (!pistonUrl) {
        logger.error('Piston API URL not configured; skipping code execution');
        throw new AppError('Code execution service is not configured', 503);
    }

    try {
        const resp = await axios.post(
            pistonUrl.includes('/execute')
                ? pistonUrl
                : `${pistonUrl.replace(/\/+$/, '')}/execute`,
            {
                language: language.toLowerCase(),
                version: '*',
                files: [{ name: 'solution', content: sourceCode }],
                stdin: '',
            },
            { timeout: 10000 }
        );
        return {
            stdout: resp.data.run.stdout,
            stderr: resp.data.run.stderr,
            exitCode: resp.data.run.code
        };
    } catch (error) {
        // winston's `simple` format drops a bare string passed as the second
        // arg, so pass it as `meta` (an object) or the real cause never
        // reaches the logs.
        logger.error('Piston API execution failed', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw new AppError('Code execution service unavailable', 503);
    }
};


const validateRunInput = (language, code, testCases) => {
    if (!code || typeof code !== 'string') {
        throw new BadRequestError('Code must be a string');
    }
    if (code.length > MAX_CODE_LENGTH) {
        throw new BadRequestError(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`);
    }
    if (!Array.isArray(testCases) || testCases.length === 0 || testCases.length > MAX_TEST_CASES) {
        throw new BadRequestError(`Test cases must be an array with a maximum of ${MAX_TEST_CASES} items`);
    }
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        if (!tc || typeof tc.input !== 'string' || tc.input.length > MAX_INPUT_LENGTH) {
            throw new BadRequestError(`Test case ${i + 1} input must be a string under ${MAX_INPUT_LENGTH} characters`);
        }
    }
};

// Runs `code` against every test case for the given language and returns
// per-case pass/fail results. Used by both the "Run" (/execute) and the
// authoritative "Submit" (/submit) paths, so there is exactly one place that
// decides what "passed" means.
const runTestCases = async (language, code, testCases) => {
    validateRunInput(language, code, testCases);

    let rawOutputs;
    let logs = '';

    if (language === 'python') {
        const sourceContent = getDriverCode(language, code, testCases);
        const run = await pyodideRunner.executePython(sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1].trim();
        }
        rawOutputs = resultsOutput.split('|||');
    } else if (language === 'javascript') {
        const sourceContent = getDriverCode(language, code, testCases);
        const run = await jsRunner.executeJavaScript(sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1].trim();
        }
        rawOutputs = resultsOutput.split('|||');
    } else if (language === 'java') {
        const sourceContent = getDriverCode(language, code, testCases);
        const run = await executePiston(language, sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1].trim();
        }
        rawOutputs = resultsOutput.split('|||');
    } else {
        throw new BadRequestError(`Unsupported language: ${language}`);
    }

    const results = testCases.map((tc, index) => {
        const actual = rawOutputs[index] !== undefined ? rawOutputs[index] : 'No Output';
        return {
            input: tc.input,
            expected: tc.output,
            actual,
            passed: actual.trim() === String(tc.output).trim()
        };
    });

    return { results, logs };
};

const tryParseJson = (val) => {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
    }
    return val;
};

const parseStructuredTestCases = (testCases, parameters) =>
    testCases.map(tc => {
        const inputs = {};
        parameters.forEach(p => { inputs[p.name] = tryParseJson(tc.inputs[p.name]); });
        return { ...tc, inputs, expected: tryParseJson(tc.expected) };
    });

const runStructuredTestCases = async (language, code, testCases, functionName, parameters, returnType) => {
    if (!code || typeof code !== 'string') {
        throw new BadRequestError('Code must be a string');
    }
    if (code.length > MAX_CODE_LENGTH) {
        throw new BadRequestError(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`);
    }
    if (!Array.isArray(testCases) || testCases.length === 0 || testCases.length > MAX_TEST_CASES) {
        throw new BadRequestError(`Test cases must be an array with a maximum of ${MAX_TEST_CASES} items`);
    }

    testCases = parseStructuredTestCases(testCases, parameters);

    let rawOutputs;
    let logs = '';

    if (language === 'python') {
        const sourceContent = buildStructuredDriverCode(language, code, functionName, parameters, testCases);
        const run = await pyodideRunner.executePython(sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1];
        }

        const lines = resultsOutput.trim().split('\n');
        rawOutputs = lines.map((line, _idx) => {
            if (line.startsWith('PASS')) {
                const val = line.replace('PASS:', '');
                try { return { status: 'ok', value: JSON.parse(val) }; } catch { return { status: 'ok', value: val }; }
            } else if (line.startsWith('FAIL:')) {
                return { status: 'error', message: line.replace('FAIL:', '') };
            }
            return { status: 'error', message: line };
        });
    } else if (language === 'javascript') {
        const sourceContent = buildStructuredDriverCode(language, code, functionName, parameters, testCases);
        const run = await jsRunner.executeJavaScript(sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1];
        }

        const lines = resultsOutput.trim().split('\n');
        rawOutputs = lines.map((line, _idx) => {
            if (line.startsWith('PASS')) {
                const val = line.replace('PASS:', '');
                try { return { status: 'ok', value: JSON.parse(val) }; } catch { return { status: 'ok', value: val }; }
            } else if (line.startsWith('FAIL:')) {
                return { status: 'error', message: line.replace('FAIL:', '') };
            }
            return { status: 'error', message: line };
        });
    } else if (language === 'java') {
        const sourceContent = buildStructuredDriverCode(language, code, functionName, parameters, testCases);
        const run = await executePiston(language, sourceContent);

        if (run.stderr) {
            return { error: run.stderr };
        }

        const rawOutput = run.stdout;
        let resultsOutput = rawOutput;
        if (rawOutput.includes('===LOGS_DONE===')) {
            const parts = rawOutput.split('===LOGS_DONE===');
            logs = parts[0].trim();
            resultsOutput = parts[1];
        }

        const lines = resultsOutput.trim().split('\n');
        rawOutputs = lines.map((line, _idx) => {
            if (line.startsWith('PASS')) {
                const val = line.replace('PASS:', '');
                try { return { status: 'ok', value: JSON.parse(val) }; } catch { return { status: 'ok', value: val }; }
            } else if (line.startsWith('FAIL:')) {
                return { status: 'error', message: line.replace('FAIL:', '') };
            }
            return { status: 'error', message: line };
        });
    } else {
        throw new BadRequestError(`Unsupported language: ${language}`);
    }

    const results = testCases.map((tc, index) => {
        const raw = rawOutputs[index];
        let passed = false;
        let actual = 'No Output';

        if (raw && raw.status === 'ok') {
            actual = raw.value;
            passed = typedCompare(tryParseJson(tc.expected), raw.value, returnType);
        } else if (raw && raw.status === 'error') {
            actual = raw.message || 'Error';
            passed = false;
        }

        const inputsRecord = {};
        parameters.forEach(param => { inputsRecord[param.name] = tc.inputs[param.name]; });

        return {
            inputs: inputsRecord,
            expected: tc.expected,
            actual,
            passed
        };
    });

    return { results, logs };
};

module.exports = {
    getDriverCode,
    executePiston,
    runTestCases,
    runStructuredTestCases,
    validateRunInput,
    MAX_CODE_LENGTH,
    MAX_TEST_CASES,
    MAX_INPUT_LENGTH,
};
