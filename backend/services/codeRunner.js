const axios = require('axios');
const vm = require('vm');
const logger = require('../utils/logger');
const pyodideRunner = require('./pyodideRunner');
const { AppError, BadRequestError } = require('../utils/errors');

const MAX_CODE_LENGTH = 10000;
const MAX_TEST_CASES = 10;
const MAX_INPUT_LENGTH = 500;
const JS_TIMEOUT_MS = 3000;

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

    return userCode;
};

const executePiston = async (language, sourceCode) => {
    try {
        const resp = await axios.post(
            process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute',
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

// Runs student JavaScript in-process via Node's `vm` module with a hard
// timeout, so a submit-time infinite loop can't hang the server. Note: `vm`
// bounds synchronous runtime, it is not a hardened security sandbox against
// a deliberately malicious escape attempt — adequate for catching accidental
// infinite loops / runtime errors in student solutions, not for running
// fully untrusted adversarial code.
const runJavaScriptTestCases = (userCode, testCases) => {
    const logs = [];
    const captureLog = (...args) => {
        logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    };
    const sandbox = { console: { log: captureLog, error: captureLog, warn: captureLog } };
    const context = vm.createContext(sandbox);

    try {
        vm.runInContext(userCode, context, { timeout: JS_TIMEOUT_MS, displayErrors: true });
    } catch (e) {
        return { error: `Error: ${e.message}` };
    }

    if (typeof sandbox.solve !== 'function') {
        return { error: "Error: Function 'solve' not found" };
    }

    const outputs = testCases.map((tc) => {
        sandbox.__input__ = tc.input;
        try {
            const result = vm.runInContext('solve(__input__)', context, { timeout: JS_TIMEOUT_MS });
            return result === undefined ? 'undefined' : String(result);
        } catch (e) {
            return `Error: ${e.message}`;
        }
    });

    return { outputs, logs: logs.join('\n') };
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

    if (language === 'javascript') {
        const { outputs, logs: jsLogs, error } = runJavaScriptTestCases(code, testCases);
        if (error) return { error };
        rawOutputs = outputs;
        logs = jsLogs;
    } else if (language === 'python' || language === 'java') {
        const sourceContent = getDriverCode(language, code, testCases);
        // Python runs locally via Pyodide (bundled WASM interpreter, no
        // third-party service); Java still depends on the public Piston API.
        const run = language === 'python'
            ? await pyodideRunner.executePython(sourceContent)
            : await executePiston(language, sourceContent);

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
        const actual = rawOutputs[index] !== undefined ? rawOutputs[index].replace(/\n/g, '') : 'No Output';
        return {
            input: tc.input,
            expected: tc.output,
            actual,
            passed: actual.trim() === String(tc.output).trim()
        };
    });

    return { results, logs };
};

module.exports = {
    getDriverCode,
    executePiston,
    runJavaScriptTestCases,
    runTestCases,
    validateRunInput,
    MAX_CODE_LENGTH,
    MAX_TEST_CASES,
    MAX_INPUT_LENGTH,
};
