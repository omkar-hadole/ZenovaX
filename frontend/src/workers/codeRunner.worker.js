// Runs student JavaScript off the main thread so an infinite loop in their
// `solve` can't freeze the tab — the main thread races this against a
// timeout and calls worker.terminate() if it doesn't respond in time.
self.onmessage = (e) => {
    const { code, testCases, functionName, parameters, returnType, isStructured } = e.data;
    const logs = [];

    const formatArg = (a) => (typeof a === 'object' ? JSON.stringify(a) : String(a));
    self.console.log = (...args) => logs.push({ type: 'log', text: args.map(formatArg).join(' ') });
    self.console.error = (...args) => logs.push({ type: 'error', text: args.map(formatArg).join(' ') });

    const parseRaw = (raw, type) => {
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (type === 'integer') return parseInt(trimmed, 10);
            if (type === 'float') return parseFloat(trimmed);
            if (type === 'boolean') return trimmed === 'true' || trimmed === 'True' || trimmed === '1';
            if (type === 'string') return trimmed;
        }
        return raw;
    };

    const serializeValue = (value, type) => {
        const isArr = type.endsWith('[]');
        const base = isArr ? type.slice(0, -2) : type;
        if (isArr) {
            let arr = value;
            if (typeof arr === 'string') {
                try { arr = JSON.parse(arr); } catch { arr = arr.split(',').map(s => s.trim()).filter(s => s !== ''); }
            }
            if (!Array.isArray(arr)) arr = [];
            if (base.endsWith('[]')) {
                return arr.map(v => serializeValue(v, base));
            }
            return arr.map(v => parseRaw(v, base));
        }
        return parseRaw(value, type);
    };

    const typedCompare = (expected, actual, type) => {
        const bothArrays = Array.isArray(expected) && Array.isArray(actual);
        if (bothArrays) {
            if (expected.length !== actual.length) return false;
            const innerType = type.endsWith('[]') ? type.slice(0, -2) : type;
            return expected.every((_, i) => typedCompare(expected[i], actual[i], innerType));
        }
        if (type === 'float' || (type === 'integer' && !Number.isInteger(actual))) {
            const a = Number(actual), e = Number(expected);
            return !isNaN(a) && !isNaN(e) && Math.abs(a - e) < 1e-6;
        }
        if (type === 'integer') {
            return Number(actual) === Number(expected);
        }
        if (type === 'boolean') {
            return Boolean(actual) === Boolean(expected);
        }
        if (type === 'string') {
            return String(actual) === String(expected);
        }
        if (type.endsWith('[]')) {
            const innerType = type.slice(0, -2);
            if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
            if (actual.length !== expected.length) return false;
            return actual.every((v, i) => typedCompare(expected[i], v, innerType));
        }
        return String(actual) === String(expected);
    };

    const results = [];
    try {
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            let userOutput = null;
            let error = null;

            try {
                let userFunc;
                try {
                    if (isStructured) {
                        const paramNames = parameters.map(p => p.name).join(', ');
                        userFunc = new Function(...parameters.map(p => p.name), code + `\nreturn ${functionName}(${paramNames});`);
                    } else {
                        userFunc = new Function('input', code + '\nreturn solve(input);');
                    }
                } catch (syntaxErr) {
                    throw new SyntaxError(syntaxErr.message);
                }

                let result;
                if (isStructured) {
                    const args = parameters.map(p => serializeValue(tc.inputs[p.name], p.type));
                    result = userFunc(...args);
                } else {
                    result = userFunc(tc.input);
                }

                if (typeof result === 'object' && result !== null) {
                    userOutput = JSON.stringify(result);
                } else if (result !== undefined && result !== null) {
                    userOutput = String(result);
                } else {
                    userOutput = 'undefined';
                }
            } catch (err) {
                error = err.message;
                if (err instanceof SyntaxError) throw err;
                logs.push({ type: 'error', text: `Test Case ${i + 1} Error: ${err.message}` });
            }

            let passed;
            if (isStructured) {
                let expectedVal;
                try { expectedVal = JSON.parse(tc.expected); } catch { expectedVal = tc.expected; }
                let actualVal;
                try { actualVal = JSON.parse(userOutput); } catch { actualVal = userOutput; }
                const compareResult = typedCompare(expectedVal, actualVal, returnType);
                if (!compareResult && !error) {
                    logs.push({ type: 'error', text: `DEBUG: type=${returnType} exp=${JSON.stringify(expectedVal)} act=${JSON.stringify(actualVal)} expIsArr=${Array.isArray(expectedVal)} actIsArr=${Array.isArray(actualVal)}` });
                }
                passed = !error && compareResult;
                const normExpected = typeof expectedVal === 'object' ? JSON.stringify(expectedVal) : String(expectedVal);
                results.push({
                    inputs: tc.inputs,
                    expected: normExpected,
                    actual: error ? `Error: ${error}` : userOutput,
                    passed
                });
            } else {
                results.push({
                    input: tc.input,
                    expected: tc.output ? tc.output.trim() : '',
                    actual: error ? `Error: ${error}` : userOutput,
                    passed
                });
            }
        }
        self.postMessage({ results, logs });
    } catch (globalError) {
        self.postMessage({ error: globalError.message, logs });
    }
};
