import React from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FeedbackActions() {
    const navigate = useNavigate();

    return (
        <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Feedback & Reports</h3>

            <div className="space-y-3">
                <button
                    onClick={() => navigate('/mentor/reviews')}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 p-4 rounded-2xl font-semibold hover:bg-[#C9C7F5]/10 hover:border-[#C9C7F5] hover:text-[#5a59b5] transition-all group flex items-center justify-between"
                >
                    <span>Reviews Received</span>
                    <Star className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#5a59b5] transition-colors" />
                </button>

                <button
                    onClick={() => navigate('/mentor/reports')}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 p-4 rounded-2xl font-semibold hover:bg-red-500/5 dark:hover:bg-red-500/5 hover:border-red-200 dark:hover:border-red-900/60 hover:text-red-400 dark:hover:text-red-300 transition-all group flex items-center justify-between"
                >
                    <span>Reports Received</span>
                    <AlertTriangle className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-400 dark:group-hover:text-red-300 transition-colors" />
                </button>
            </div>
        </section>
    );
}
