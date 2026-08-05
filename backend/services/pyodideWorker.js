// Runs inside a Node worker_thread (spawned by pyodideRunner.js) so a
// student's infinite loop blocks only this worker's thread, not the main
// server process — the parent enforces a timeout and terminates this thread
// if it doesn't respond in time.
const { parentPort } = require('worker_threads');
const { loadPyodide } = require('pyodide');

let pyodideInstance = null;

// Eagerly load the ~14MB Pyodide runtime at worker startup and tell the parent
// when it's ready. The parent waits for this before starting the student's
// per-execution timeout, so runtime startup is charged to a (generous) load
// budget, never to the user's code.
(async () => {
    try {
        pyodideInstance = await loadPyodide();
        parentPort.postMessage({ type: 'ready' });
    } catch (e) {
        parentPort.postMessage({ type: 'load-error', stderr: e.message || 'Python runtime failed to load' });
    }
})();

const cleanTraceback = (raw) => {
    if (!raw) return raw;
    const lines = raw.split('\n');
    const kept = [];
    let i = 0;
    if (lines[0]?.startsWith('Traceback')) kept.push(lines[i++]);
    for (; i < lines.length; i++) {
        const frameMatch = lines[i].match(/^\s*File "([^"]*)"/);
        if (frameMatch) {
            const isUserFrame = frameMatch[1] === '<exec>';
            const frameLines = [lines[i]];
            i++;
            while (i < lines.length && !lines[i].match(/^\s*File "/) && lines[i].startsWith(' ')) {
                frameLines.push(lines[i]);
                i++;
            }
            i--;
            if (isUserFrame) kept.push(...frameLines);
            continue;
        }
        kept.push(lines[i]);
    }
    return kept.join('\n').trim();
};

parentPort.on('message', async ({ id, sourceCode }) => {
    try {
        if (!pyodideInstance) throw new Error('Python runtime is still initializing, please retry');
        const pyodide = pyodideInstance;
        const namespace = pyodide.globals.get('dict')();
        try {
            // The driver script (see codeRunner.js's getDriverCode) guards its
            // entry point with `if __name__ == "__main__":`, matching how a
            // real `python3 script.py` process behaves. Our namespace is a
            // bare dict, not a real module, so __name__ must be set by hand
            // or that guard silently evaluates false and nothing ever runs.
            pyodide.runPython("import sys, io\nsys.stdout = io.StringIO()\n__name__ = '__main__'", { globals: namespace });

            let stderr = '';
            try {
                await pyodide.runPythonAsync(sourceCode, { globals: namespace });
            } catch (e) {
                stderr = cleanTraceback(e.message || String(e));
            }

            const stdout = pyodide.runPython('sys.stdout.getvalue()', { globals: namespace });
            parentPort.postMessage({ id, result: { stdout, stderr } });
        } finally {
            pyodide.runPython('import sys; sys.stdout = sys.__stdout__');
            namespace.destroy();
        }
    } catch (error) {
        parentPort.postMessage({ id, result: { stdout: '', stderr: error.message || 'Python execution failed' } });
    }
});
