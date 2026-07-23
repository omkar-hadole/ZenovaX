import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Save, Rocket, Plus, Trash2, EyeOff, Eye } from 'lucide-react';
import { apiCall } from '../utils/api';
import Toast from '../components/Toast';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
];

const emptyStarterCode = { javascript: '', python: '', java: '' };

export default function LaunchCodingQuestion({ setActiveTab, mySessions }) {
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [questionData, setQuestionData] = useState({
        title: '',
        description: '',
        difficulty: 'MEDIUM',
        testCases: [{ input: '', output: '', isHidden: false }],
        points: 100,
        timeLimitMinutes: '',
        referenceSolution: ''
    });
    const [allowedLanguages, setAllowedLanguages] = useState(['javascript', 'python', 'java']);
    const [starterCode, setStarterCode] = useState(emptyStarterCode);
    const [starterCodeTab, setStarterCodeTab] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [status, setStatus] = useState('DRAFT');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!isEditMode) return;
        const loadQuestion = async () => {
            try {
                const data = await apiCall(`/coding-questions/${id}`);
                const q = data.question;
                if (q.status !== 'DRAFT') {
                    setToast({ message: 'Only draft questions can be edited. Close and relaunch a new one instead.', type: 'error' });
                }
                setStatus(q.status);
                setSelectedSessionId(q.sessionId);
                let parsedTestCases = [{ input: '', output: '', isHidden: false }];
                try {
                    const parsed = typeof q.testCases === 'string' ? JSON.parse(q.testCases) : q.testCases;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        parsedTestCases = parsed.map((tc, idx) => ({
                            input: tc.input || '',
                            output: tc.output || '',
                            isHidden: typeof tc.isHidden === 'boolean' ? tc.isHidden : idx >= 2
                        }));
                    }
                } catch (e) {
                    console.error('Failed to parse existing test cases', e);
                }
                setQuestionData({
                    title: q.title || '',
                    description: q.description || '',
                    difficulty: q.difficulty || 'MEDIUM',
                    testCases: parsedTestCases,
                    points: q.points ?? 100,
                    timeLimitMinutes: q.timeLimitMinutes ?? '',
                    referenceSolution: q.referenceSolution || ''
                });
                if (q.allowedLanguages) {
                    try {
                        const langs = typeof q.allowedLanguages === 'string' ? JSON.parse(q.allowedLanguages) : q.allowedLanguages;
                        if (Array.isArray(langs) && langs.length > 0) setAllowedLanguages(langs);
                    } catch (e) { console.error('Failed to parse allowedLanguages', e); }
                }
                if (q.starterCode) {
                    try {
                        const map = typeof q.starterCode === 'string' ? JSON.parse(q.starterCode) : q.starterCode;
                        setStarterCode({ ...emptyStarterCode, ...map });
                    } catch (e) { console.error('Failed to parse starterCode', e); }
                }
            } catch (error) {
                console.error('Failed to load question for editing', error);
                setToast({ message: 'Failed to load question', type: 'error' });
            } finally {
                setFetching(false);
            }
        };
        loadQuestion();
    }, [id, isEditMode]);

    const handleAddTestCase = () => {
        setQuestionData(prev => ({
            ...prev,
            testCases: [...prev.testCases, { input: '', output: '', isHidden: prev.testCases.length >= 2 }]
        }));
    };

    const handleRemoveTestCase = (index) => {
        if (questionData.testCases.length > 1) {
            setQuestionData(prev => ({
                ...prev,
                testCases: prev.testCases.filter((_, i) => i !== index)
            }));
        }
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...questionData.testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
    };

    const toggleLanguage = (lang) => {
        setAllowedLanguages(prev => {
            if (prev.includes(lang)) {
                if (prev.length === 1) return prev; // at least one language required
                return prev.filter(l => l !== lang);
            }
            return [...prev, lang];
        });
    };

    const handleSubmit = async (isLaunch = false) => {
        if (!selectedSessionId) {
            setToast({ message: 'Please select a session', type: 'error' });
            return;
        }
        if (!questionData.title || !questionData.description) {
            setToast({ message: 'Please fill in title and description', type: 'error' });
            return;
        }

        const validTestCases = questionData.testCases.filter(tc => tc.input && tc.output);
        if (validTestCases.length === 0) {
            setToast({ message: 'Please add at least one valid test case (input/output pair)', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: questionData.title,
                description: questionData.description,
                difficulty: questionData.difficulty,
                testCases: validTestCases,
                sessionId: selectedSessionId,
                allowedLanguages: allowedLanguages.length === LANGUAGES.length ? null : allowedLanguages,
                starterCode: Object.fromEntries(allowedLanguages.map(l => [l, starterCode[l] || ''])),
                referenceSolution: questionData.referenceSolution || null,
                timeLimitMinutes: questionData.timeLimitMinutes === '' ? null : Number(questionData.timeLimitMinutes),
                points: questionData.points === '' ? 100 : Number(questionData.points)
            };

            let questionId = id;
            if (isEditMode) {
                await apiCall(`/coding-questions/${id}`, 'PUT', payload);
            } else {
                const response = await apiCall('/coding-questions/create', 'POST', payload);
                questionId = response.codingQuestion?.id;
            }

            if (isLaunch && questionId) {
                await apiCall(`/coding-questions/${questionId}/launch`, 'PUT');
                setToast({ message: 'Coding Question Launched Successfully!', type: 'success' });
            } else {
                setToast({ message: isEditMode ? 'Changes Saved Successfully!' : 'Draft Saved Successfully!', type: 'success' });
            }
            setTimeout(() => {
                setActiveTab('Dashboard');
            }, 1500);
        } catch (error) {
            console.error('Submission error:', error);
            setToast({ message: error.message || 'Failed to save/launch question', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    const isLocked = isEditMode && status === 'CLOSED';
    const isEditingLive = isEditMode && status === 'LIVE';

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('Dashboard')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {isEditMode ? 'Edit Coding Question' : 'Launch Coding Question'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isEditMode ? 'Update this coding challenge' : 'Create a new coding challenge for your students'}
                    </p>
                </div>
            </div>

            {isLocked && (
                <div className="mb-6 px-4 py-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-400">
                    This question is closed and can no longer be edited. Create a new one to make changes.
                </div>
            )}

            {isEditingLive && (
                <div className="mb-6 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-sm text-blue-800 dark:text-blue-400">
                    This question is live — changes, including new or edited test cases, apply immediately for students.
                </div>
            )}

            <fieldset disabled={isLocked} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden disabled:opacity-60">
                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Session Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Session</label>
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transaction-all"
                        >
                            <option value="">Choose a session...</option>
                            {mySessions.map(session => (
                                <option key={session.id} value={session.id}>{session.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title & Difficulty */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Title</label>
                            <input
                                type="text"
                                value={questionData.title}
                                onChange={(e) => setQuestionData({ ...questionData, title: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="e.g. Reverse a Linked List"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                            <select
                                value={questionData.difficulty}
                                onChange={(e) => setQuestionData({ ...questionData, difficulty: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Points & Time Limit */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points</label>
                            <input
                                type="number"
                                min="0"
                                value={questionData.points}
                                onChange={(e) => setQuestionData({ ...questionData, points: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (minutes, optional)</label>
                            <input
                                type="number"
                                min="0"
                                value={questionData.timeLimitMinutes}
                                onChange={(e) => setQuestionData({ ...questionData, timeLimitMinutes: e.target.value })}
                                placeholder="No limit"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problem Statement</label>
                        <textarea
                            value={questionData.description}
                            onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
                            rows={6}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="Describe the problem, input format, constraints, etc..."
                        />
                    </div>

                    {/* Allowed Languages */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Languages</label>
                        <div className="flex gap-3">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    type="button"
                                    onClick={() => toggleLanguage(lang.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${allowedLanguages.includes(lang.value)
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Starter Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starter Code (optional, per language)</label>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                                {allowedLanguages.map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => setStarterCodeTab(lang)}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${starterCodeTab === lang
                                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                            <Editor
                                height="200px"
                                language={allowedLanguages.includes(starterCodeTab) ? starterCodeTab : allowedLanguages[0]}
                                value={starterCode[allowedLanguages.includes(starterCodeTab) ? starterCodeTab : allowedLanguages[0]] || ''}
                                theme="vs-dark"
                                onChange={(value) => setStarterCode(prev => ({ ...prev, [starterCodeTab]: value }))}
                                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                            />
                        </div>
                    </div>

                    {/* Test Cases */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Cases</label>
                            <button
                                type="button"
                                onClick={handleAddTestCase}
                                className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                                <Plus className="w-4 h-4" /> Add Case
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questionData.testCases.map((tc, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 group">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Input</label>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                                rows={2}
                                                className="w-full p-2 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono"
                                                placeholder="Input data..."
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Expected Output</label>
                                            <textarea
                                                value={tc.output}
                                                onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                                rows={2}
                                                className="w-full p-2 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono"
                                                placeholder="Expected output..."
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTestCase(index)}
                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg mt-6 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTestCaseChange(index, 'isHidden', !tc.isHidden)}
                                        className={`mt-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${tc.isHidden
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                            }`}
                                    >
                                        {tc.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {tc.isHidden ? 'Hidden from students' : 'Visible sample case'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reference Solution */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference Solution (optional, mentor-only notes)</label>
                        <textarea
                            value={questionData.referenceSolution}
                            onChange={(e) => setQuestionData({ ...questionData, referenceSolution: e.target.value })}
                            rows={4}
                            className="w-full p-2 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono"
                            placeholder="Never shown to students — for your own reference when reviewing submissions."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    {isEditingLive ? (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Save Draft
                            </button>
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {loading ? 'Processing...' : <><Rocket className="w-4 h-4" /> Launch Question</>}
                            </button>
                        </>
                    )}
                </div>
            </fieldset>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
