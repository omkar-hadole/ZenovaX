// Runs student JavaScript off the main thread so an infinite loop in their
// `solve` can't freeze the tab — the main thread races this against a
// timeout and calls worker.terminate() if it doesn't respond in time.
self.onmessage = (e) => {
    const { code, testCases } = e.data;
    const logs = [];

    const formatArg = (a) => (typeof a === 'object' ? JSON.stringify(a) : String(a));
    self.console.log = (...args) => logs.push({ type: 'log', text: args.map(formatArg).join(' ') });
    self.console.error = (...args) => logs.push({ type: 'error', text: args.map(formatArg).join(' ') });

    const results = [];
    try {
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const expectedVal = tc.output ? tc.output.trim() : '';
            let userOutput = null;
            let error = null;

            try {
                let userFunc;
                try {
                    userFunc = new Function('input', code + '\nreturn solve(input);');
                } catch (syntaxErr) {
                    throw new SyntaxError(syntaxErr.message);
                }

                const result = userFunc(tc.input);
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

            const passed = !error && userOutput && userOutput.trim() === expectedVal;
            results.push({
                input: tc.input,
                expected: expectedVal,
                actual: error ? `Error: ${error}` : userOutput,
                passed
            });
        }
        self.postMessage({ results, logs });
    } catch (globalError) {
        self.postMessage({ error: globalError.message, logs });
    }
};
