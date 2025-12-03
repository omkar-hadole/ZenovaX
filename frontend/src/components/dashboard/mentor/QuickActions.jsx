import React from 'react';
import { PlusCircle, Upload, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
    const navigate = useNavigate();

    return (
        <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>

            <div className="space-y-3">
                <button
                    onClick={() => navigate('/mentor/create-session')}
                    className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl font-semibold hover:bg-[#C9C7F5]/10 hover:border-[#C9C7F5] hover:text-[#5a59b5] transition-all group flex items-center justify-between"
                >
                    <span>Create Session</span>
                    <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-[#5a59b5] transition-colors" />
                </button>

                <button
                    onClick={() => navigate('/mentor/upload-resource')}
                    className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl font-semibold hover:bg-[#A9C1F7]/10 hover:border-[#A9C1F7] hover:text-[#4a7ac7] transition-all group flex items-center justify-between"
                >
                    <span>Upload Resource</span>
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#4a7ac7] transition-colors" />
                </button>

                <button
                    onClick={() => navigate('/mentor/launch-quiz')}
                    className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl font-semibold hover:bg-[#F7D483]/10 hover:border-[#F7D483] hover:text-[#b59a5a] transition-all group flex items-center justify-between"
                >
                    <span>Launch Quiz</span>
                    <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-[#b59a5a] transition-colors" />
                </button>
            </div>
        </section>
    );
}
