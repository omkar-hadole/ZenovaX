import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Play, CheckCircle, XCircle, ArrowLeft, RefreshCw, Wand2, Terminal, List, AlertTriangle, History, Bug } from 'lucide-react';
import { apiCall } from '../../utils/api';
import Toast from '../../components/Toast';
import CodeDebuggerPanel from '../../components/CodeDebuggerPanel';

const MD = {
  strong: ({ children, ...props }) => <strong className="font-bold text-gray-100" {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em className="italic text-gray-300" {...props}>{children}</em>,
  h1: ({ children, ...props }) => <h1 className="text-lg font-bold text-gray-100 mt-4 mb-2 border-b border-white/10 pb-1" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-base font-bold text-gray-100 mt-3 mb-1.5" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-sm font-semibold text-gray-100 mt-3 mb-1" {...props}>{children}</h3>,
  ul: ({ children, ...props }) => <ul className="list-disc list-outside ml-5 my-2 space-y-0.5 text-gray-300" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="list-decimal list-outside ml-5 my-2 space-y-0.5 text-gray-300" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
  p: ({ children, ...props }) => <p className="mb-2 leading-relaxed text-gray-300" {...props}>{children}</p>,
  a: ({ children, href, ...props }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-300 transition-colors" {...props}>{children}</a>,
  pre: ({ children, ...props }) => <pre className="bg-black/40 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono text-gray-200" {...props}>{children}</pre>,
  code: ({ className, children, ...props }) => {
    if (className) return <code className="text-sm font-mono text-gray-200" {...props}>{children}</code>;
    return <code className="text-indigo-400 font-semibold" {...props}>{children}</code>;
  },
  blockquote: ({ children, ...props }) => <blockquote className="border-l-3 border-indigo-400/40 pl-3 py-1 my-2 italic text-gray-400" {...props}>{children}</blockquote>,
};

export default function AttemptCodingQuestion({ previewMode = false, backPath }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const editorRef = useRef(null);

    // Language State
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');

    const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'console' | 'submissions'
    const [output, setOutput] = useState([]);
    const [results, setResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [indentError, setIndentError] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [toast, setToast] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
    const [debuggerOpen, setDebuggerOpen] = useState(false);

    const fetchSubmissions = async () => {
        try {
            const data = await apiCall(`/coding-questions/${id}/submissions/mine`);
            setSubmissions(data.submissions || []);
        } catch (error) {
            console.error('Failed to fetch submission history', error);
        } finally {
            setSubmissionsLoaded(true);
        }
    };

    // --- Resizable Layout Logic ---
    const [leftWidth, setLeftWidth] = useState(30); // Percentage
    const [topHeight, setTopHeight] = useState(60); // Percentage
    const containerRef = useRef(null);
    const rightPanelRef = useRef(null);
    const isDraggingLeft = useRef(false);
    const isDraggingTop = useRef(false);

    // Initialize layout from localStorage
    useEffect(() => {
        const savedLayout = localStorage.getItem('compiler-layout');
        if (savedLayout) {
            try {
                const { left, top } = JSON.parse(savedLayout);
                if (left) setLeftWidth(Math.max(20, Math.min(80, left)));
                if (top) setTopHeight(Math.max(20, Math.min(80, top)));
            } catch (e) { console.error("Layout parse error", e); }
        }
    }, []);

    // Save layout on change
    useEffect(() => {
        localStorage.setItem('compiler-layout', JSON.stringify({ left: leftWidth, top: topHeight }));
    }, [leftWidth, topHeight]);

    const startDragLeft = () => {
        isDraggingLeft.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Prevent selection
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', stopDrag);
    };

    const startDragTop = () => {
        isDraggingTop.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', stopDrag);
    };

    const handleDragMove = (e) => {
        if (isDraggingLeft.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            setLeftWidth(Math.max(20, Math.min(80, newLeftWidth)));
        }
        if (isDraggingTop.current && rightPanelRef.current) {
            const panelRect = rightPanelRef.current.getBoundingClientRect();
            const newTopHeight = ((e.clientY - panelRect.top) / panelRect.height) * 100;
            setTopHeight(Math.max(20, Math.min(80, newTopHeight)));
        }
    };

    const stopDrag = () => {
        isDraggingLeft.current = false;
        isDraggingTop.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', stopDrag);
    };

    const LANGUAGE_LABELS = { javascript: 'JavaScript', python: 'Python', java: 'Java' };
    const allowedLanguageOptions = (() => {
        let langs = ['javascript', 'python', 'java'];
        if (question?.allowedLanguages) {
            try {
                const parsed = typeof question.allowedLanguages === 'string' ? JSON.parse(question.allowedLanguages) : question.allowedLanguages;
                if (Array.isArray(parsed) && parsed.length > 0) langs = parsed;
            } catch (e) { console.error('Failed to parse allowedLanguages', e); }
        }
        return langs.map(l => ({ value: l, label: LANGUAGE_LABELS[l] || l }));
    })();

    const STRUCTURED_TYPE_MAP = {
        integer: 'int', float: 'double', string: 'String', boolean: 'boolean',
        'integer[]': 'int[]', 'float[]': 'double[]', 'string[]': 'String[]', 'boolean[]': 'boolean[]',
        'integer[][]': 'int[][]', 'float[][]': 'double[][]', 'string[][]': 'String[][]', 'boolean[][]': 'boolean[][]'
    };

    const generateStructuredBoilerplate = (functionName, parameters, returnType, lang) => {
        const paramStr = parameters.map(p => p.name).join(', ');
        if (lang === 'javascript') {
            return `// Write your solution here\nfunction ${functionName}(${paramStr}) {\n  // Your code here\n  \n}`;
        }
        if (lang === 'python') {
            return `# Write your solution here\ndef ${functionName}(${paramStr}):\n    # Your code here\n    pass\n`;
        }
        if (lang === 'java') {
            const jParams = parameters.map(p => `${STRUCTURED_TYPE_MAP[p.type] || 'String'} ${p.name}`).join(', ');
            const jRet = STRUCTURED_TYPE_MAP[returnType] || 'void';
            return `// Write your solution here\nclass Solution {\n    public static ${jRet} ${functionName}(${jParams}) {\n        // Your code here\n        \n    }\n}\n`;
        }
        return '';
    };

    const BOILERPLATES = {
        javascript: `// Write your solution here
function solve(input) {
  // Your code here
  return input;
}`,
        python: `# Write your solution here
def solve(input):
    # Your code here
    return input
`,
        java: `// Write your solution here
class Solution {
    public static String solve(String input) {
        // Your code here
        return input;
    }
}
`
    };

    const draftKey = (lang) => `coding-draft-${id}-${lang}`;

    const formatSignature = (q) => {
        if (q?.questionType !== 'structured' || !q?.functionName) return null;
        let params = [];
        try { params = typeof q.parameters === 'string' ? JSON.parse(q.parameters) : q.parameters; } catch {}
        const paramStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
        return `${q.functionName}(${paramStr}) → ${q.returnType}`;
    };

    // Starter code precedence: student's own cached draft > mentor-authored
    // starter code for this question/language > generated structured stub > generic boilerplate.
    const getInitialCode = (lang, q) => {
        const cached = localStorage.getItem(draftKey(lang));
        if (cached !== null) return cached;
        if (q?.starterCode) {
            try {
                const map = typeof q.starterCode === 'string' ? JSON.parse(q.starterCode) : q.starterCode;
                if (map?.[lang]) return map[lang];
            } catch (e) { console.error('Failed to parse starter code', e); }
        }
        if (q?.questionType === 'structured' && q?.functionName) {
            let params = [];
            try { params = typeof q.parameters === 'string' ? JSON.parse(q.parameters) : q.parameters; } catch {}
            if (params.length > 0) {
                return generateStructuredBoilerplate(q.functionName, params, q.returnType, lang);
            }
        }
        return BOILERPLATES[lang];
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        setCode(getInitialCode(newLang, question));
    };

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const data = await apiCall(`/coding-questions/${id}`);
                setQuestion(data.question);
                setCode(getInitialCode(language, data.question));
                if (!previewMode && data.question && data.question.status !== 'LIVE') {
                    setToast({ message: 'This question is not live yet.', type: 'error' });
                    setTimeout(() => {
                        navigate(-1);
                    }, 1500);
                }
            } catch (error) {
                console.error('Failed to fetch question', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestion();
    }, [id, navigate]);

    // Debounced auto-save of the current draft, per question + language, so a
    // refresh or a language switch never loses in-progress work.
    useEffect(() => {
        if (!code) return;
        const timeout = setTimeout(() => {
            localStorage.setItem(draftKey(language), code);
        }, 500);
        return () => clearTimeout(timeout);
    }, [code, language, id]);

    // Validation Logic
    const validateIndentation = (sourceCode, lang) => {
        const lines = sourceCode.split('\n');
        let indentType = null; // 'space' or 'tab'

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (!trimmed) continue;

            const match = line.match(/^(\s+)/);
            if (!match) continue;

            const whitespace = match[1];
            const isTab = whitespace.includes('\t');
            const isSpace = whitespace.includes(' ');

            if (isTab && isSpace) return `Line ${i + 1}: Mixed tabs and spaces.`;

            if (!indentType) {
                indentType = isTab ? 'tab' : 'space';
            } else if ((indentType === 'tab' && isSpace) || (indentType === 'space' && isTab)) {
                return `Line ${i + 1}: Inconsistent indentation (mixed tabs/spaces).`;
            }

            if (lang === 'python' && indentType === 'space') {
                if (whitespace.length % 4 !== 0) {
                    return `Line ${i + 1}: Python requires 4 spaces per indent.`;
                }
            }
        }
        return null;
    };

    // Auto Format
    const handleFormatCode = async () => {
        if (!editorRef.current) return;

        // 1. Convert Tabs to Spaces (4)
        let formatted = code.replace(/\t/g, '    ');

        // 2. Simple Trim
        formatted = formatted.split('\n').map(l => l.trimEnd()).join('\n');

        setCode(formatted);

        // 3. Trigger Monaco's Format Document Action (Best effort for JS/Java)
        // Note: Python formatting in browser is limited without a language server
        setTimeout(() => {
            editorRef.current.trigger('anyString', 'editor.action.formatDocument');
        }, 100);

        setIndentError(null); // Clear error after format
    };

    const runCode = async (mode = 'run') => {
        if (!question || !question.testCases) return;

        const err = validateIndentation(code, language);
        if (err) {
            setIndentError(err);
            setOutput(prev => [...prev, { type: 'error', text: `Indentation Error: ${err}` }]);
            setActiveTab('console');
            return;
        }
        setIndentError(null);

        setIsRunning(true);
        setResults(null);
        setOutput([]);
        setActiveTab('tests');

        // Submit never pre-verifies locally: the server independently re-runs
        // every test case against the real (never-redacted) data and decides
        // pass/fail — running the student's code against the client's
        // redacted "Hidden" placeholders here would give a wrong answer (or
        // throw, e.g. `JSON.parse("Hidden")`) for every hidden test case.
        if (mode === 'submit' && !previewMode) {
            const { submission, results: submitResults, error: submitError } = await apiCall(`/coding-questions/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ code, language })
            });

            if (submitError) {
                setOutput(prev => [...prev, { type: 'error', text: `Execution Error: ${submitError}` }]);
                setActiveTab('console');
            } else {
                setResults(submitResults);
                setActiveTab('tests');
                if (submission.status === 'PASSED') {
                    setQuestion(prev => ({ ...prev, isSolved: true }));
                    setShowSuccessPopup(true);
                } else {
                    setToast({ message: 'Some test cases failed — check Test Results.', type: 'error' });
                }
            }
            fetchSubmissions();
            setIsRunning(false);
            return;
        }

        const isStructured = question.questionType === 'structured';

        let allTestCases = [];
        let structuredTestCases = [];
        try {
            if (isStructured) {
                structuredTestCases = typeof question.structuredTestCases === 'string' ? JSON.parse(question.structuredTestCases) : question.structuredTestCases;
            } else {
                allTestCases = typeof question.testCases === 'string' ? JSON.parse(question.testCases) : question.testCases;
            }
        } catch (e) {
            console.error("Test cases parse error", e);
            setOutput(prev => [...prev, { type: 'error', text: 'System Error: Invalid test cases format.' }]);
            setActiveTab('console');
            setIsRunning(false);
            return;
        }

        const testCasesToRun = isStructured
            ? (previewMode ? structuredTestCases : structuredTestCases.slice(0, 2))
            : (previewMode ? allTestCases : allTestCases.slice(0, 2));

        let parameters = [];
        try { parameters = typeof question.parameters === 'string' ? JSON.parse(question.parameters) : (question.parameters || []); } catch {}

        const processResults = async (rawResults, error) => {
            if (error) {
                setOutput(prev => [...prev, { type: 'error', text: `Execution Error: ${error}` }]);
                setActiveTab('console');
                return;
            }

            setResults(rawResults);
            setActiveTab('tests');
        };

        if (language === 'python' || language === 'java') {
            try {
                const body = isStructured
                    ? { language, code, structuredTestCases: testCasesToRun, codingQuestionId: id }
                    : { language, code, testCases: testCasesToRun, codingQuestionId: id };
                const { results, logs, error } = await apiCall('/coding-questions/execute', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                await processResults(results, error);
                if (logs) {
                    const formattedLogs = logs.split('\n').filter(line => line.trim() !== '').map(text => ({ type: 'log', text }));
                    setOutput(prev => [...prev, ...formattedLogs]);
                }
            } catch (err) {
                setOutput(prev => [...prev, { type: 'error', text: `Network Error: ${err.message}` }]);
                setActiveTab('console');
            } finally {
                setIsRunning(false);
            }
            return;
        }

        // Javascript Exec — runs in a Web Worker so a `solve` that infinite-loops
        // can't freeze the tab; the worker is terminated if it doesn't respond
        // within the timeout, and a fresh one is spun up on every run.
        const JS_TIMEOUT_MS = 5000;
        const worker = new Worker(new URL('../../workers/codeRunner.worker.js', import.meta.url), { type: 'module' });

        const workerResult = await new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                worker.terminate();
                resolve({ error: `Execution timed out after ${JS_TIMEOUT_MS / 1000}s — check for an infinite loop.` });
            }, JS_TIMEOUT_MS);

            worker.onmessage = (e) => {
                clearTimeout(timeoutId);
                worker.terminate();
                resolve(e.data);
            };
            worker.onerror = (e) => {
                clearTimeout(timeoutId);
                worker.terminate();
                resolve({ error: e.message || 'Worker error' });
            };

            const workerMsg = isStructured
                ? { code, testCases: testCasesToRun, isStructured: true, functionName: question.functionName, parameters, returnType: question.returnType }
                : { code, testCases: testCasesToRun };
            worker.postMessage(workerMsg);
        });

        if (workerResult.logs?.length > 0) {
            setOutput(prev => [...prev, ...workerResult.logs]);
        }

        if (workerResult.error) {
            await processResults(null, workerResult.error);
            setActiveTab('console');
        } else {
            await processResults(workerResult.results, null);
            if (workerResult.results.some(r => !r.passed)) {
                setActiveTab('tests');
            }
        }
        setIsRunning(false);
    };

    // Refs to hold latest functions to avoid stale closures in event listeners
    const runCodeRef = useRef(null);
    const formatCodeRef = useRef(null);
    
    useEffect(() => {
        runCodeRef.current = runCode;
    }, [runCode]);

    useEffect(() => {
        formatCodeRef.current = handleFormatCode;
    }, [handleFormatCode]);

    // Detect OS for shortcuts
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierName = isMac ? '⌘' : 'Ctrl';
    const shiftName = isMac ? '⇧' : 'Shift';

    useEffect(() => {
        const handleKeyDown = (e) => {
            const platformModifier = isMac ? e.metaKey : e.ctrlKey;
            
            // Format: Cmd + Shift + F / Ctrl + Shift + F
            if (platformModifier && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                if (formatCodeRef.current) formatCodeRef.current();
            }
            // Run: Cmd + ' / Ctrl + '
            else if (platformModifier && e.key === "'") {
                e.preventDefault();
                if (runCodeRef.current) runCodeRef.current('run');
            }
            // Submit: Cmd + Enter / Ctrl + Enter
            else if (platformModifier && e.key === 'Enter') {
                e.preventDefault();
                if (runCodeRef.current) runCodeRef.current('submit');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMac]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e]">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!question) return <div className="text-center p-8 text-white">Question not found</div>;

    return (
        <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-300 font-sans">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#1e1e1e] z-10 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(backPath || (question.sessionId ? `/sessions/${question.sessionId}` : -1))}
                        className="flex items-center gap-2 p-2 pr-3 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:inline">
                            {previewMode ? 'Back to Questions' : 'Back to Session'}
                        </span>
                    </button>

                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg text-white tracking-tight">{question.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase ${question.difficulty === 'HARD' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                                question.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' :
                                    'bg-green-500/20 text-green-500 border border-green-500/20'
                                }`}>
                                {question.difficulty}
                            </span>
                            {previewMode && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                                    Preview Mode
                                </span>
                            )}
                            {question.isSolved && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-500 border border-green-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    <CheckCircle className="w-3 h-3" /> Solved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zen AI Debugger Button */}
                    <button
                        onClick={() => setDebuggerOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                            debuggerOpen
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
                                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                    >
                        <Bug className="w-3.5 h-3.5" />
                        {debuggerOpen ? 'Close Zen' : 'Ask Zen AI'}
                    </button>

                    <div className="h-6 w-px bg-white/10" />

                    <div className="relative group">
                        <button
                            onClick={handleFormatCode}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                        >
                            <Wand2 className="w-3.5 h-3.5" />
                            Format
                        </button>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] border border-white/10 rounded-lg shadow-xl text-[11px] text-gray-200 whitespace-nowrap z-50 pointer-events-none">
                            <span>Format</span>
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">{modifierName}</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">{shiftName}</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">F</kbd>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-white/5 mx-1"></div>

                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="bg-white/5 text-gray-400 text-xs font-medium px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-indigo-500/50 transition-colors cursor-pointer hover:bg-white/10"
                    >
                        {allowedLanguageOptions.map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                    </select>

                    <div className="relative group">
                        <button
                            onClick={() => runCode('run')}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-5 py-2 font-medium text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                        >
                            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            Run
                        </button>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] border border-white/10 rounded-lg shadow-xl text-[11px] text-gray-200 whitespace-nowrap z-50 pointer-events-none">
                            <span>Run</span>
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">{modifierName}</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">'</kbd>
                        </div>
                    </div>

                    {!previewMode && (
                        <div className="relative group">
                            <button
                                onClick={() => runCode('submit')}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-5 py-2 font-medium text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                            >
                                Submit
                            </button>
                            {/* Custom Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] border border-white/10 rounded-lg shadow-xl text-[11px] text-gray-200 whitespace-nowrap z-50 pointer-events-none">
                                <span>Submit</span>
                                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">{modifierName}</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[10px] font-mono leading-none">↵</kbd>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Resizable Container */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden relative">

                {/* Left Panel: Problem Description */}
                <div style={{ width: `${leftWidth}%` }} className="border-r border-white/5 flex flex-col bg-[#111111] min-w-[250px]">
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-gray-200 max-w-none">
                            <h3 className="text-xl font-semibold mb-6 text-gray-100">Problem Description</h3>
                            <div className="mb-8">
                              <ReactMarkdown
                                remarkPlugins={[remarkBreaks, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={MD}
                              >{question.description}</ReactMarkdown>
                            </div>

                            {formatSignature(question) && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Function Signature</h4>
                                    <div className="font-mono text-sm text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg">
                                        {formatSignature(question)}
                                    </div>
                                </div>
                            )}

                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Example Test Cases</h4>
                            <div className="space-y-4">
                                {(() => {
                                    try {
                                        const isStructured = question.questionType === 'structured';
                                        let cases;
                                        if (isStructured) {
                                            cases = typeof question.structuredTestCases === 'string' ? JSON.parse(question.structuredTestCases) : question.structuredTestCases;
                                        } else {
                                            cases = typeof question.testCases === 'string' ? JSON.parse(question.testCases) : question.testCases;
                                        }
                                        let params = [];
                                        try { params = typeof question.parameters === 'string' ? JSON.parse(question.parameters) : question.parameters; } catch {}
                                        return cases.slice(0, 2).map((tc, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                                                {isStructured ? (
                                                    <>
                                                        <div className="mb-3 space-y-2">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inputs</span>
                                                            {params.filter(p => p.name).map(p => (
                                                                <div key={p.name} className="font-mono text-sm text-gray-300 bg-black/30 p-2 rounded-lg mt-1">
                                                                    {p.name} ({p.type}): {tc.inputs?.[p.name] !== undefined ? JSON.stringify(tc.inputs[p.name]) : '—'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expected</span>
                                                            <div className="font-mono text-sm text-gray-300 bg-black/30 p-2.5 rounded-lg mt-1.5">{JSON.stringify(tc.expected)}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="mb-3">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Input</span>
                                                            <div className="font-mono text-sm text-gray-300 bg-black/30 p-2.5 rounded-lg mt-1.5">{tc.input}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output</span>
                                                            <div className="font-mono text-sm text-gray-300 bg-black/30 p-2.5 rounded-lg mt-1.5">{tc.output}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ));
                                    } catch (e) {
                                        return <div className="text-red-400 text-sm">Error loading examples</div>;
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Drag Handle */}
                <div
                    onMouseDown={startDragLeft}
                    className="w-1 bg-[#2a2a2a] hover:bg-indigo-500 cursor-col-resize flex items-center justify-center transition-colors z-20"
                />

                {/* Right Panel: Editor & Output */}
                <div ref={rightPanelRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col bg-[#1e1e1e]">

                    {/* Editor Area (Top) */}
                    <div style={{ height: `${topHeight}%` }} className="flex flex-col relative min-h-[150px]">

                        {/* Indentation Error Alert (Absolute to not break flex flow if possible, or just stack) */}
                        {indentError && (
                            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                                    <AlertTriangle className="w-4 h-4" />
                                    {indentError}
                                </div>
                                <button
                                    onClick={handleFormatCode}
                                    className="text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded transition-colors"
                                >
                                    Auto-Fix
                                </button>
                            </div>
                        )}

                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                theme="vs-dark"
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    
                                    // Submit command: Cmd+Enter (Mac) / Ctrl+Enter (Win/Linux)
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                                        if (runCodeRef.current) runCodeRef.current('submit');
                                    });

                                    // Run command: Cmd+' (Mac) / Ctrl+' (Win/Linux)
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.US_QUOTE, () => {
                                        if (runCodeRef.current) runCodeRef.current('run');
                                    });

                                    // Format command: Cmd+Shift+F (Mac) / Ctrl+Shift+F (Win/Linux)
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
                                        if (formatCodeRef.current) formatCodeRef.current();
                                    });
                                }}
                                onChange={(value) => setCode(value)}
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 16,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                    fontLigatures: true,
                                    automaticLayout: true,
                                    tabSize: 4,
                                    insertSpaces: true,
                                    detectIndentation: false,
                                    renderWhitespace: 'selection',
                                    renderIndentGuides: true,
                                    rulers: [],
                                    bracketPairColorization: { enabled: true },
                                    padding: { top: 24, bottom: 24 },
                                    smoothScrolling: true,
                                    cursorBlinking: "smooth",
                                    cursorSmoothCaretAnimation: "on",
                                    lineNumbersMinChars: 3,
                                    glyphMargin: false,
                                    folding: true,
                                    scrollBeyondLastColumn: 0,
                                    overviewRulerLanes: 0,
                                    hideCursorInOverviewRuler: true,
                                    overviewRulerBorder: false,
                                    scrollbar: {
                                        vertical: 'visible',
                                        horizontal: 'visible',
                                        useShadows: false,
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Horizontal Drag Handle */}
                    <div
                        onMouseDown={startDragTop}
                        className="h-1 bg-[#2a2a2a] hover:bg-indigo-500 cursor-row-resize flex items-center justify-center transition-colors z-20"
                    />

                    {/* Output Panel (Bottom) */}
                    <div style={{ height: `${100 - topHeight}%` }} className="border-t border-white/10 bg-[#1e1e1e] flex flex-col min-h-[100px]">
                        <div className="flex items-center border-b border-white/10 bg-[#1e1e1e]">
                            <button
                                onClick={() => setActiveTab('tests')}
                                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'tests' ? 'text-white border-indigo-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4" /> Test Results
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('console')}
                                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'console' ? 'text-white border-indigo-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4" /> Console / Output
                                </div>
                            </button>
                            <button
                                onClick={() => { setActiveTab('submissions'); if (!submissionsLoaded) fetchSubmissions(); }}
                                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'submissions' ? 'text-white border-indigo-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4" /> Submissions
                                </div>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-[#151515]">

                            {activeTab === 'tests' && (
                                <div className="p-6">
                                    {!results && !isRunning && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 py-10 opacity-50">
                                            <Play className="w-8 h-8" />
                                            <p className="font-medium">Run code to see test results</p>
                                        </div>
                                    )}

                                    {isRunning && (
                                        <div className="p-4 text-gray-400 font-mono text-sm flex items-center gap-3">
                                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                                            Executing test cases...
                                        </div>
                                    )}

                                    {results && (
                                        <div className="space-y-4">
                                            {/* Test Case List */}
                                            <div className="grid grid-cols-1 gap-3">
                                                {results.map((res, i) => (
                                                    <div key={i} className={`group overflow-hidden rounded-lg border transition-all duration-300 ${res.passed ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-rose-500/10 bg-rose-500/5'}`}>
                                                        {/* Header */}
                                                        <div className="p-4 flex items-center justify-between cursor-default">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${res.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                                    {i + 1}
                                                                </span>
                                                                <span className={`font-medium text-sm ${res.passed ? 'text-emerald-300/90' : 'text-rose-300/90'}`}>Test Case {i + 1}</span>
                                                            </div>
                                                            {res.passed ?
                                                                <CheckCircle className="w-5 h-5 text-emerald-500/50" /> :
                                                                <span className="text-xs font-bold uppercase tracking-wider text-rose-500/70">Failed</span>
                                                            }
                                                        </div>

                                                        {/* Details (Only for failed tests) */}
                                                        {!res.isHidden && !res.passed && (
                                                            <div className="px-4 pb-4 pt-0">
                                                                <div className="bg-black/20 p-3 rounded border border-white/5 space-y-3">
                                                                    {res.inputs && question.questionType === 'structured' && (
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Inputs</span>
                                                                            {Object.entries(res.inputs).map(([key, val]) => (
                                                                                <div key={key} className="font-mono text-xs text-gray-400 mt-1">
                                                                                    {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {res.input !== undefined && (
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Input</span>
                                                                            <div className="font-mono text-sm text-gray-400">{res.input}</div>
                                                                        </div>
                                                                    )}
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Expected</span>
                                                                            <div className="font-mono text-sm text-emerald-300/80">{typeof res.expected === 'object' ? JSON.stringify(res.expected) : String(res.expected)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Actual</span>
                                                                            <div className="font-mono text-sm text-rose-300/80">{typeof res.actual === 'object' ? JSON.stringify(res.actual) : String(res.actual)}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'console' && (
                                <div className="p-6 font-mono text-sm leading-relaxed h-full overflow-y-auto bg-black/10 select-text">
                                    {output.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-gray-500 gap-2 py-10 opacity-40">
                                            <Terminal className="w-5 h-5" />
                                            <span className="text-xs">No console logs to display.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {output.map((log, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`flex items-start gap-3 font-mono text-sm leading-relaxed ${
                                                        log.type === 'error' ? 'text-rose-400' : 'text-gray-300'
                                                    }`}
                                                >
                                                    <span className="text-gray-600 select-none text-right min-w-[20px] font-mono">{i + 1}</span>
                                                    <pre className="flex-1 whitespace-pre-wrap font-mono m-0 text-sm leading-relaxed">{log.text}</pre>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="p-6">
                                    {submissions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-gray-500 gap-3 py-10 opacity-50">
                                            <History className="w-8 h-8" />
                                            <p className="font-medium">No submissions yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {submissions.map((sub) => (
                                                <div key={sub.id} className={`flex items-center justify-between p-4 rounded-lg border ${sub.status === 'PASSED' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-rose-500/10 bg-rose-500/5'}`}>
                                                    <div className="flex items-center gap-3">
                                                        {sub.status === 'PASSED' ? (
                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-rose-500" />
                                                        )}
                                                        <div>
                                                            <span className={`font-medium text-sm ${sub.status === 'PASSED' ? 'text-emerald-300/90' : 'text-rose-300/90'}`}>
                                                                {sub.status === 'PASSED' ? 'Passed' : 'Failed'}
                                                            </span>
                                                            <div className="text-xs text-gray-500">
                                                                {LANGUAGE_LABELS[sub.language] || sub.language} • {new Date(sub.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Success Popup Modal */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                        <p className="text-gray-400 mb-8">
                            Your solution passed all test cases and has been submitted successfully.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                            >
                                Keep Coding
                            </button>
                            <button
                                onClick={() => navigate(question.sessionId ? `/sessions/${question.sessionId}` : '/dashboard')}
                                className="flex-1 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Context-Aware Zen AI Debugger Panel */}
            <CodeDebuggerPanel
                question={question}
                code={code}
                language={language}
                isOpen={debuggerOpen}
                onClose={() => setDebuggerOpen(false)}
            />
        </div>
    );
}
