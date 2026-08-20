import React, { useState } from 'react';
import { X, ArrowUp, Monitor, MapPin, Layers, EyeOff } from 'lucide-react';

const MODES = [
    { value: 'EITHER', label: 'Either', Icon: Layers, hint: 'No preference' },
    { value: 'ONLINE', label: 'Online', Icon: Monitor, hint: 'Video call' },
    { value: 'OFFLINE', label: 'Offline', Icon: MapPin, hint: 'In person' },
];

export default function CreateLearningRequestModal({ onClose, onCreate }) {
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [preferredMode, setPreferredMode] = useState('EITHER');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        if (!description.trim()) {
            setError('Please describe what you want to learn.');
            return;
        }

        setLoading(true);
        try {
            await onCreate({ topic: topic.trim(), description: description.trim(), preferredMode, isAnonymous });
        } catch (err) {
            setError(err.message || 'Failed to create request');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create a Learning Request</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ask for a session on a topic you want to learn.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-500/20 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Binary Search Trees"
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What do you want to learn?</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={5000}
                            placeholder="e.g. I need help with insertion, deletion and traversal for my exam."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                        />
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {description.split('\n').length}/15 lines
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preferred Mode <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="flex gap-3">
                            {MODES.map(({ value, label, Icon, hint }) => (
                                <label
                                    key={value}
                                    className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                        preferredMode === value
                                            ? 'border-[#C9C7F5] bg-[#C9C7F5]/10 dark:bg-[#C9C7F5]/10 text-[#5a59b5] dark:text-[#9190F8]'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <input type="radio" name="preferredMode" value={value} checked={preferredMode === value} onChange={() => setPreferredMode(value)} className="hidden" />
                                    <Icon className="w-5 h-5" />
                                    <span className="font-bold text-sm">{label}</span>
                                    <span className="text-[10px]">{hint}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 cursor-pointer bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 flex items-center justify-center shrink-0">
                                <EyeOff className="w-4 h-4 text-[#5a59b5] dark:text-[#9190F8]" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">Post anonymously</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your name won't be shown on this request.</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isAnonymous ? 'bg-[#5a59b5]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isAnonymous ? 'left-[22px]' : 'left-0.5'}`} />
                        </div>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="hidden" />
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-[#C9C7F5] text-[#5a59b5] font-bold hover:bg-[#b8b6e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#5a59b5] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ArrowUp className="w-5 h-5" />
                                    Create Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}