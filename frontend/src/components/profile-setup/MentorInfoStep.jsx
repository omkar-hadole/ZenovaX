import React, { useState } from 'react';
import { Phone, Linkedin, Plus, X } from 'lucide-react';
import { FieldGroup, Chip } from './FormComponents';

const mentorSkillOptions = [
    'Data Structures',
    'AI & ML',
    'UI/UX Design',
    'Product Strategy',
    'Finance Basics',
    'Marketing Analytics',
    'Entrepreneurship',
    'Public Speaking',
];

export default function MentorInfoStep({ mentorInfo, setMentorInfo, toggleSkill, isPhoneValid, isLinkedInValid }) {
    const [customSkill, setCustomSkill] = useState('');

    const addCustomSkill = () => {
        const trimmed = customSkill.trim();
        if (!trimmed) return;
        if (mentorInfo.skills.includes(trimmed)) {
            setCustomSkill('');
            return;
        }
        setMentorInfo((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
        setCustomSkill('');
    };

    return (
        <div className="space-y-8">
            <FieldGroup label="Skills or subjects you can teach" required description="Pick at least one focus area.">
                <div className="flex flex-wrap gap-3">
                    {mentorSkillOptions.map((skill) => (
                        <Chip key={skill} label={skill} active={mentorInfo.skills.includes(skill)} onClick={() => toggleSkill(skill)} />
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C9C7F5] bg-white dark:bg-gray-800 placeholder:text-gray-400"
                        placeholder="Type a custom skill and press Enter"
                    />
                    <button
                        type="button"
                        onClick={addCustomSkill}
                        disabled={!customSkill.trim()}
                        className="p-2.5 rounded-xl bg-[#C9C7F5] text-[#5a59b5] hover:bg-[#b8b6e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {mentorInfo.skills.filter(s => !mentorSkillOptions.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {mentorInfo.skills.filter(s => !mentorSkillOptions.includes(s)).map((skill) => (
                            <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C9C7F5]/20 text-[#5a59b5] dark:text-[#b3b1f0] text-sm font-medium">
                                {skill}
                                <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </FieldGroup>

            <FieldGroup label="Phone number" required>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isPhoneValid ? 'border-gray-200 dark:border-gray-700 focus-within:border-[#C9C7F5] focus-within:ring-2 focus-within:ring-[#C9C7F5]/20' : 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10'}`}>
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                        type="tel"
                        value={mentorInfo.phone}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        className="flex-1 bg-transparent text-gray-700 dark:text-gray-100 focus:outline-none font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="+91 9876543210"
                    />
                </div>
                {!isPhoneValid && mentorInfo.phone.length > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">Enter a valid number (at least 10 digits).</p>
                )}
                {mentorInfo.phone.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">e.g. +91 9876543210 or 9876543210</p>
                )}
            </FieldGroup>

            <FieldGroup label="LinkedIn URL" required={false}>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isLinkedInValid ? 'border-gray-200 dark:border-gray-700 focus-within:border-[#C9C7F5] focus-within:ring-2 focus-within:ring-[#C9C7F5]/20' : 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10'}`}>
                    <Linkedin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                        type="url"
                        value={mentorInfo.linkedin}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, linkedin: e.target.value }))}
                        className="flex-1 bg-transparent text-gray-700 dark:text-gray-100 focus:outline-none font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="https://linkedin.com/in/your-handle"
                    />
                </div>
                {!isLinkedInValid && mentorInfo.linkedin.length > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">Please enter a valid LinkedIn profile URL.</p>
                )}
            </FieldGroup>
        </div>
    );
}
