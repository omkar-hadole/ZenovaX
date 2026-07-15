import React from 'react';
import { UserCircle2 } from 'lucide-react';

export const StepIndicator = ({ step, total }) => {
    const progress = Math.round((step / total) * 100);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>{`Step ${step} of ${total}`}</span>
                <span>{progress}% complete</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-[#C9C7F5]" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

export const RoleOption = ({ label, description, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start gap-2 rounded-[1.5rem] border px-6 py-4 text-left transition-all ${selected ? 'border-[#C9C7F5] bg-[#C9C7F5]/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-[#C9C7F5]/50 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-[#C9C7F5] text-[#5a59b5]' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                <UserCircle2 className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{label}</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </button>
);

export const FieldGroup = ({ label, required, children, description }) => (
    <label className="space-y-2 block">
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
            {required && <span className="text-xs text-[#5a59b5] dark:text-[#b3b1f0] bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 px-2 py-px rounded-full font-medium">required</span>}
        </div>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        {children}
    </label>
);

export const Chip = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${active ? 'bg-[#C9C7F5] text-[#5a59b5] border-[#C9C7F5]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#C9C7F5] hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
    >
        {label}
    </button>
);
