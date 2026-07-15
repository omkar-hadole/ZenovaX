import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Rocket, Plus, Trash2, Code } from 'lucide-react'; // Added Code icon here for sidebar use later if needed, but not used in body yet
import { apiCall } from '../utils/api';
import Toast from '../components/Toast';

export default function LaunchCodingQuestion({ setActiveTab, mySessions }) {
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [questionData, setQuestionData] = useState({
        title: '',
        description: '',
        difficulty: 'MEDIUM',
        testCases: [{ input: '', output: '' }]
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleAddTestCase = () => {
        setQuestionData(prev => ({
            ...prev,
            testCases: [...prev.testCases, { input: '', output: '' }]
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
        newTestCases[index][field] = value;
        setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
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

        // Basic test case validation
        const validTestCases = questionData.testCases.filter(tc => tc.input && tc.output);
        if (validTestCases.length === 0) {
            setToast({ message: 'Please add at least one valid test case (input/output pair)', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...questionData,
                testCases: validTestCases,
                sessionId: selectedSessionId
            };

            const response = await apiCall('/coding-questions/create', 'POST', payload);

            if (response.success) {
                if (isLaunch) {
                    await apiCall(`/coding-questions/${response.codingQuestion.id}/launch`, 'PUT');
                    setToast({ message: 'Coding Question Launched Successfully!', type: 'success' });
                } else {
                    setToast({ message: 'Draft Saved Successfully!', type: 'success' });
                }
                setTimeout(() => {
                    setActiveTab('Dashboard');
                }, 1500);
            }
        } catch (error) {
            console.error('Submission error:', error);
            setToast({ message: 'Failed to save/launch question', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Launch Coding Question</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create a new coding challenge for your students</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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

                    {/* Test Cases */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Cases</label>
                            <button
                                onClick={handleAddTestCase}
                                className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                                <Plus className="w-4 h-4" /> Add Case
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questionData.testCases.map((tc, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 group">
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
                                        onClick={() => handleRemoveTestCase(index)}
                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg mt-6 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
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
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
