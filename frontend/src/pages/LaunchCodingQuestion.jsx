import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Rocket, Plus, Trash2, Code } from 'lucide-react'; // Added Code icon here for sidebar use later if needed, but not used in body yet
import { apiCall } from '../utils/api';

export default function LaunchCodingQuestion({ setActiveTab, mySessions }) {
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [questionData, setQuestionData] = useState({
        title: '',
        description: '',
        difficulty: 'MEDIUM',
        testCases: [{ input: '', output: '' }]
    });
    const [loading, setLoading] = useState(false);

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
            alert('Please select a session');
            return;
        }
        if (!questionData.title || !questionData.description) {
            alert('Please fill in title and description');
            return;
        }

        // Basic test case validation
        const validTestCases = questionData.testCases.filter(tc => tc.input && tc.output);
        if (validTestCases.length === 0) {
            alert('Please add at least one valid test case (input/output pair)');
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
                    alert('Coding Question Launched Successfully!');
                } else {
                    alert('Draft Saved Successfully!');
                }
                setActiveTab('Dashboard');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to save/launch question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('Dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Launch Coding Question</h1>
                    <p className="text-gray-500">Create a new coding challenge for your students</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Session Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Session</label>
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transaction-all"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                            <input
                                type="text"
                                value={questionData.title}
                                onChange={(e) => setQuestionData({ ...questionData, title: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="e.g. Reverse a Linked List"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                            <select
                                value={questionData.difficulty}
                                onChange={(e) => setQuestionData({ ...questionData, difficulty: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statement</label>
                        <textarea
                            value={questionData.description}
                            onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
                            rows={6}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="Describe the problem, input format, constraints, etc..."
                        />
                    </div>

                    {/* Test Cases */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700">Test Cases</label>
                            <button
                                onClick={handleAddTestCase}
                                className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700"
                            >
                                <Plus className="w-4 h-4" /> Add Case
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questionData.testCases.map((tc, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Input</label>
                                        <textarea
                                            value={tc.input}
                                            onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                                            placeholder="Input data..."
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Expected Output</label>
                                        <textarea
                                            value={tc.output}
                                            onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                                            placeholder="Expected output..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveTestCase(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg mt-6 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
        </div>
    );
}
