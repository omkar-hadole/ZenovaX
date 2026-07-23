const path = require('path');
const { Worker } = require('worker_threads');
const logger = require('../utils/logger');

// Pyodide (a full CPython build compiled to WebAssembly) replaces the public
// Piston API for Python execution — Piston went whitelist-only, Pyodide is a
// bundled npm dependency with no network dependency and no third-party
// service to be denied access to.
//
// It runs inside a persistent worker_thread (see pyodideWorker.js), not on
// the main thread: Pyodide's execution is synchronous from Node's point of
// view, so a student's infinite loop would otherwise freeze the entire
// server for every user, not just that one request. The worker is reused
// across requests (loading Pyodide's ~14MB runtime takes a couple of seconds,
// so paying that cost once matters), and is killed and replaced only if a
// run times out or the thread errors.
const PYTHON_TIMEOUT_MS = 8000;

let worker = null;
let msgId = 0;
const pending = new Map();

const spawnWorker = () => {
    const w = new Worker(path.join(__dirname, 'pyodideWorker.js'));

    w.on('message', (msg) => {
        const entry = pending.get(msg.id);
        if (!entry) return;
        clearTimeout(entry.timeoutHandle);
        pending.delete(msg.id);
        entry.resolve(msg.result);
    });

    // Scoped to THIS worker instance only — `pending` is a single shared map
    // across worker generations, so once a replacement worker is spawned and
    // has its own in-flight entries, this dead worker's delayed 'exit' event
    // must not resolve (and thus destroy) those newer entries too.
    const failPendingForThisWorker = (message) => {
        for (const [id, entry] of pending) {
            if (entry.worker !== w) continue;
            clearTimeout(entry.timeoutHandle);
            entry.resolve({ stdout: '', stderr: message });
            pending.delete(id);
        }
    };

    w.on('error', (err) => {
        logger.error('Pyodide worker crashed', { message: err.message });
        failPendingForThisWorker(err.message || 'Python worker crashed');
        if (worker === w) worker = null;
    });

    w.on('exit', () => {
        failPendingForThisWorker('Python worker exited unexpectedly');
        if (worker === w) worker = null;
    });

    return w;
};

const getWorker = () => {
    if (!worker) worker = spawnWorker();
    return worker;
};

// Runs `sourceCode` (a full driver script, same shape as the old Piston
// python driver — it prints its results to stdout) and returns the captured
// stdout/stderr, mirroring the {stdout, stderr} shape `executePiston` used
// to return so the caller's parsing logic doesn't need to change.
const executePython = (sourceCode) => new Promise((resolve) => {
    const id = ++msgId;
    const w = getWorker();

    const timeoutHandle = setTimeout(() => {
        pending.delete(id);
        resolve({ stdout: '', stderr: `Execution timed out after ${PYTHON_TIMEOUT_MS / 1000}s — check for an infinite loop.` });
        // The worker is stuck running synchronous Python; terminate and let
        // the next call spawn a fresh one rather than queuing behind it.
        w.terminate();
        if (worker === w) worker = null;
    }, PYTHON_TIMEOUT_MS);

    pending.set(id, { resolve, timeoutHandle, worker: w });
    w.postMessage({ id, sourceCode });
});

module.exports = { executePython };
