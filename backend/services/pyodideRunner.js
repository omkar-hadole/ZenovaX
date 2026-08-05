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
//
// The 8s PYTHON_TIMEOUT_MS below is a budget for the STUDENT'S CODE ONLY.
// Loading Pyodide is infra startup: the worker eager-loads the runtime and
// posts a 'ready' message; getWorker() waits on that with its own generous
// LOAD_TIMEOUT_MS. Only after the runtime is ready does the per-execution
// timer start — otherwise every Python run on a cold worker gets its 8s
// budget swallowed by the WASM load and valid (non-infinite-loop) code is
// falsely reported as "timed out".
const PYTHON_TIMEOUT_MS = 8000;
const LOAD_TIMEOUT_MS = 30000;

let worker = null;
let loaded = false;
let readyPromise = null;
let msgId = 0;
const pending = new Map();

const spawnWorker = () => {
    const w = new Worker(path.join(__dirname, 'pyodideWorker.js'));
    loaded = false;
    let resolveReady;
    let rejectReady;
    readyPromise = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });

    w.on('message', (msg) => {
        if (msg.type === 'ready') {
            resolveReady();
            return;
        }
        if (msg.type === 'load-error') {
            rejectReady(new Error(msg.stderr || 'Python runtime failed to load'));
            return;
        }
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
        rejectReady(new Error(err.message || 'Python worker crashed'));
        failPendingForThisWorker(err.message || 'Python worker crashed');
        if (worker === w) worker = null;
    });

    w.on('exit', () => {
        rejectReady(new Error('Python worker exited unexpectedly'));
        failPendingForThisWorker('Python worker exited unexpectedly');
        if (worker === w) worker = null;
    });

    return w;
};

const getWorker = async () => {
    if (!worker) worker = spawnWorker();
    if (loaded) return worker;

    let handle;
    const loadTimeout = new Promise((_, reject) => {
        handle = setTimeout(() => reject(new Error('Python runtime timed out while loading')), LOAD_TIMEOUT_MS);
    });
    try {
        await Promise.race([readyPromise, loadTimeout]);
        loaded = true;
    } finally {
        clearTimeout(handle);
    }
    return worker;
};

// Runs `sourceCode` (a full driver script, same shape as the old Piston
// python driver — it prints its results to stdout) and returns the captured
// stdout/stderr, mirroring the {stdout, stderr} shape `executePiston` used
// to return so the caller's parsing logic doesn't need to change.
const executePython = (sourceCode) => new Promise((resolve) => {
    getWorker()
        .then((w) => {
            const id = ++msgId;

            const timeoutHandle = setTimeout(() => {
                pending.delete(id);
                resolve({ stdout: '', stderr: `Execution timed out after ${PYTHON_TIMEOUT_MS / 1000}s — check for an infinite loop or algorithm complexity.` });
                // The worker is stuck running synchronous Python; terminate
                // and let the next call spawn a fresh one rather than
                // queuing behind it.
                w.terminate();
                if (worker === w) worker = null;
            }, PYTHON_TIMEOUT_MS);

            pending.set(id, { resolve, timeoutHandle, worker: w });
            w.postMessage({ id, sourceCode });
        })
        .catch((error) => {
            resolve({ stdout: '', stderr: error.message || 'Python runtime failed to start' });
        });
});

module.exports = { executePython };
