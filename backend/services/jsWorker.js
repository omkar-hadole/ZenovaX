// Runs inside a Node worker_thread (spawned by jsRunner.js) so a student's
// infinite loop blocks only this worker's thread, not the main server
// process — the parent enforces a timeout and terminates this thread if it
// doesn't respond in time. This mirrors pyodideWorker.js but for JavaScript.
const { parentPort } = require('worker_threads');

const formatArg = (a) => (typeof a === 'object' ? JSON.stringify(a) : String(a));

const capture = (hook) => (...args) => hook(args.map(formatArg).join(' '));

parentPort.on('message', ({ id, sourceCode }) => {
    let stdout = '';
    let stderr = '';

    // Minimal prisoner environment: shadow the Node globals a student could
    // use to escape the sandbox (require, module, exports, Buffer, ...).
    // `process` and `console` are injected as explicit params below so the
    // driver script's writes are captured into our buffers instead of
    // leaking to the real process stdout.
    const SANDBOX = [
        'require', 'module', 'exports', '__filename', '__dirname',
        'Buffer', 'setImmediate', 'queueMicrotask', 'atob', 'btoa',
        'clearImmediate'
    ];
    const SHADOWED = SANDBOX.map(() => undefined);

    try {
        // eslint-disable-next-line no-new-func
        const runner = new Function(...SANDBOX, 'console', 'process', sourceCode);

        const sandboxConsole = {
            log: capture((t) => { stdout += t + '\n'; }),
            error: capture((t) => { stderr += t + '\n'; }),
            warn: capture((t) => { stdout += t + '\n'; })
        };
        const sandboxProcess = {
            stdout: { write: (s) => { stdout += String(s); return true; } },
            stderr: { write: (s) => { stderr += String(s); return true; } }
        };

        runner.call(null, ...SHADOWED, sandboxConsole, sandboxProcess);

        parentPort.postMessage({ id, result: { stdout, stderr } });
    } catch (error) {
        if (error && error.name === 'SyntaxError') {
            stderr = `SyntaxError: ${error.message}`;
        } else {
            stderr = stderr || (error && error.message ? error.message : 'JavaScript execution failed');
        }
        parentPort.postMessage({ id, result: { stdout, stderr } });
    }
});