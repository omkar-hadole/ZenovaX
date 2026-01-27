import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, ArrowLeft, RefreshCw, Wand2, Terminal, List, AlertTriangle } from 'lucide-react';
import { apiCall } from '../../utils/api';

export default function AttemptCodingQuestion() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const editorRef = useRef(null);

    // Language State
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');

    const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'console'
    const [output, setOutput] = useState([]);
    const [results, setResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [indentError, setIndentError] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Language Change Modal State
    const [showLanguagePopup, setShowLanguagePopup] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState(null);

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

    useEffect(() => {
        // Set initial code based on default language
        setCode(BOILERPLATES['javascript']);
    }, []);

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setPendingLanguage(newLang);
        setShowLanguagePopup(true);
    };

    const confirmLanguageChange = () => {
        if (pendingLanguage) {
            setLanguage(pendingLanguage);
            setCode(BOILERPLATES[pendingLanguage]);
        }
        setShowLanguagePopup(false);
        setPendingLanguage(null);
    };

    const cancelLanguageChange = () => {
        setShowLanguagePopup(false);
        setPendingLanguage(null);
    };

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const data = await apiCall(`/coding-questions/${id}`);
                setQuestion(data.question);
                if (data.question && data.question.status !== 'LIVE') {
                    alert('This question is not live yet.');
                    navigate(-1);
                }
            } catch (error) {
                console.error('Failed to fetch question', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestion();
    }, [id, navigate]);

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

        let allTestCases = [];
        try {
            allTestCases = typeof question.testCases === 'string' ? JSON.parse(question.testCases) : question.testCases;
        } catch (e) {
            console.error("Test cases parse error", e);
            setOutput(prev => [...prev, { type: 'error', text: 'System Error: Invalid test cases format.' }]);
            setActiveTab('console');
            setIsRunning(false);
            return;
        }

        const testCasesToRun = mode === 'run' ? allTestCases.slice(0, 2) : allTestCases;

        const processResults = async (rawResults, error) => {
            if (error) {
                setOutput(prev => [...prev, { type: 'error', text: `Execution Error: ${error}` }]);
                setActiveTab('console');
                return;
            }

            const formattedResults = rawResults.map((res, index) => {
                const isHidden = mode === 'submit';
                return {
                    ...res,
                    input: isHidden ? 'Hidden' : res.input,
                    expected: isHidden ? 'Hidden' : res.expected,
                    actual: isHidden ? (res.passed ? 'Hidden' : 'Wrong Answer') : res.actual,
                    isHidden
                };
            });

            setResults(formattedResults);
            setActiveTab('tests');

            if (mode === 'submit' && formattedResults.every(r => r.passed)) {
                try {
                    await apiCall(`/coding-questions/${id}/submit`, {
                        method: 'POST',
                        body: JSON.stringify({ code, language, status: 'PASSED' })
                    });
                    setQuestion(prev => ({ ...prev, isSolved: true }));
                    setShowSuccessPopup(true);
                } catch (submitErr) {
                    console.error("Submission failed", submitErr);
                    alert("All tests passed, but failed to save submission.");
                }
            }
        };

        if (language === 'python' || language === 'java') {
            try {
                const { results, error } = await apiCall('/coding-questions/execute', {
                    method: 'POST',
                    body: JSON.stringify({ language, code, testCases: testCasesToRun })
                });
                await processResults(results, error);
            } catch (err) {
                setOutput(prev => [...prev, { type: 'error', text: `Network Error: ${err.message}` }]);
                setActiveTab('console');
            } finally {
                setIsRunning(false);
            }
            return;
        }

        // Javascript Client Exec
        const newResults = [];
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            for (let i = 0; i < testCasesToRun.length; i++) {
                const tc = testCasesToRun[i];
                const inputVal = tc.input;
                const expectedVal = tc.output ? tc.output.trim() : '';

                let userOutput = null;
                let error = null;

                try {
                    const userFunc = new Function('input', code + `\nreturn solve(input);`);
                    const result = userFunc(inputVal);
                    if (typeof result === 'object') {
                        userOutput = JSON.stringify(result);
                    } else if (result !== undefined && result !== null) {
                        userOutput = String(result);
                    } else {
                        userOutput = "undefined";
                    }
                } catch (err) {
                    error = err.message;
                }

                const passed = !error && userOutput && userOutput.trim() === expectedVal;
                newResults.push({
                    input: inputVal,
                    expected: expectedVal,
                    actual: error ? `Error: ${error}` : userOutput,
                    passed
                });
            }
            await processResults(newResults, null);
        } catch (globalError) {
            await processResults(null, globalError.message);
        } finally {
            setIsRunning(false);
        }
    };

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
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
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
                            {question.isSolved && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-500 border border-green-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    <CheckCircle className="w-3 h-3" /> Solved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleFormatCode}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                        title="Auto-Format Code"
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        Format
                    </button>

                    <div className="h-6 w-px bg-white/5 mx-1"></div>

                    <select
                        value={showLanguagePopup ? pendingLanguage : language}
                        onChange={handleLanguageChange}
                        className="bg-white/5 text-gray-400 text-xs font-medium px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-indigo-500/50 transition-colors cursor-pointer hover:bg-white/10"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>

                    <button
                        onClick={() => runCode('run')}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-5 py-2 font-medium text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                    >
                        {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Run
                    </button>

                    <button
                        onClick={() => runCode('submit')}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-5 py-2 font-medium text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    >
                        Submit
                    </button>
                </div>
            </header>

            {/* Main Content Resizable Container */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden relative">

                {/* Left Panel: Problem Description */}
                <div style={{ width: `${leftWidth}%` }} className="border-r border-white/5 flex flex-col bg-[#111111] min-w-[250px]">
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-gray-200 max-w-none">
                            <h3 className="text-xl font-semibold mb-6 text-gray-100">Problem Description</h3>
                            <div className="text-base leading-relaxed mb-8 whitespace-pre-wrap font-normal text-gray-400/90">{question.description}</div>

                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Example Test Cases</h4>
                            <div className="space-y-4">
                                {(() => {
                                    try {
                                        const cases = typeof question.testCases === 'string' ? JSON.parse(question.testCases) : question.testCases;
                                        return cases.slice(0, 2).map((tc, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="mb-3">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Input</span>
                                                    <div className="font-mono text-sm text-gray-300 bg-black/30 p-2.5 rounded-lg mt-1.5">{tc.input}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output</span>
                                                    <div className="font-mono text-sm text-gray-300 bg-black/30 p-2.5 rounded-lg mt-1.5">{tc.output}</div>
                                                </div>
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
                                onMount={(editor) => { editorRef.current = editor; }}
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
                                                                <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded border border-white/5">
                                                                    <div>
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Expected</span>
                                                                        <div className="font-mono text-sm text-emerald-300/80">{res.expected}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Actual</span>
                                                                        <div className="font-mono text-sm text-rose-300/80">{res.actual}</div>
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
                                <div className="p-6 font-mono text-sm leading-relaxed">
                                    {output.length === 0 ? (
                                        <div className="text-gray-600 italic">No output logs.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {output.map((log, i) => (
                                                <div key={i} className={`p-2 rounded border-l-2 ${log.type === 'error' ? 'text-red-300 border-red-500 bg-red-500/5' : 'text-gray-300 border-gray-600'}`}>
                                                    {log.text}
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
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Language Change Modal */}
            {showLanguagePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Change Language?</h3>
                        <p className="text-gray-400 mb-8 text-sm">
                            Switching to <span className="font-bold text-white">{pendingLanguage}</span> will <span className="text-red-400">reset your current code</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={cancelLanguageChange}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLanguageChange}
                                className="flex-1 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20 rounded-xl font-medium transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
