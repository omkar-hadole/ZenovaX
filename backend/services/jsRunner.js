const path = require('path');
const { Worker } = require('worker_threads');
const logger = require('../utils/logger');

// JavaScript no longer depends on the third-party Piston API (which became
// auth-gated in Feb 2026). Instead it runs — like Python via Pyodide — inside
// a persistent worker_thread, so a student's infinite loop blocks only that
// thread, not the main server process. The worker is reused across requests
// and killed + replaced only if a run times out or the thread errors.
const JS_TIMEOUT_MS = 8000;

let worker = null;
let msgId = 0;
const pending = new Map();

const spawnWorker = () => {
    const w = new Worker(path.join(__dirname, 'jsWorker.js'));

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
        logger.error('JS worker crashed', { message: err.message });
        failPendingForThisWorker(err.message || 'JavaScript worker crashed');
        if (worker === w) worker = null;
    });

    w.on('exit', () => {
        failPendingForThisWorker('JavaScript worker exited unexpectedly');
        if (worker === w) worker = null;
    });

    return w;
};

const getWorker = () => {
    if (!worker) worker = spawnWorker();
    return worker;
};

// Runs `sourceCode` (a full driver script — user code + driver, same shape as
// the old Piston driver: it prints results to stdout) and returns the captured
// stdout/stderr, mirroring the {stdout, stderr} contract executePiston used so
// the caller's parsing logic doesn't need to change.
const executeJavaScript = (sourceCode) => new Promise((resolve) => {
    const id = ++msgId;
    const w = getWorker();

    const timeoutHandle = setTimeout(() => {
        pending.delete(id);
        resolve({ stdout: '', stderr: `Execution timed out after ${JS_TIMEOUT_MS / 1000}s — check for an infinite loop.` });
        // The worker is stuck running synchronous user JS; terminate and let
        // the next call spawn a fresh one rather than queuing behind it.
        w.terminate();
        if (worker === w) worker = null;
    }, JS_TIMEOUT_MS);

    pending.set(id, { resolve, timeoutHandle, worker: w });
    w.postMessage({ id, sourceCode });
});

module.exports = { executeJavaScript };