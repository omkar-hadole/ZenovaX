import { useState } from 'react';
import { Phone, Linkedin, Plus, X, Check } from 'lucide-react';
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomSkill();
        }
    };

    return (
        <div className="space-y-6">
            <FieldGroup label="Skills you can teach" required description="Select at least one.">
                <div className="flex flex-wrap gap-2">
                    {mentorSkillOptions.map((skill) => (
                        <Chip
                            key={skill}
                            label={skill}
                            active={mentorInfo.skills.includes(skill)}
                            onClick={() => toggleSkill(skill)}
                        />
                    ))}
                </div>

                <div className="flex mt-3">
                    <div className="flex items-center flex-1 rounded-xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/30 hover:border-white/40 focus-within:bg-white/25 focus-within:border-white/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(111,102,255,0.12),0_4px_12px_rgba(0,0,0,0.04)] transition-all">
                        <input
                            type="text"
                            value={customSkill}
                            onChange={(e) => setCustomSkill(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent text-[#1F2F43] px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-[#1F2F43]/40"
                            placeholder="Add a custom skill"
                        />
                        <button
                            type="button"
                            onClick={addCustomSkill}
                            disabled={!customSkill.trim()}
                            className="p-2.5 mr-1 rounded-md text-text-subtle hover:text-[#6F66FF] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Add skill"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Custom skills */}
                {mentorInfo.skills.filter(s => !mentorSkillOptions.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {mentorInfo.skills.filter(s => !mentorSkillOptions.includes(s)).map((skill) => (
                            <span
                                key={skill}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                                style={{ background: '#7674E9' }}
                            >
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className="text-white/70 hover:text-white transition-colors"
                                    aria-label={`Remove ${skill}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </FieldGroup>

            <FieldGroup label="Phone number" required>
                <div
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all border border-white/30 bg-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/30 hover:border-white/40 ${
                        mentorInfo.phone.length === 0
                            ? 'focus-within:bg-white/25 focus-within:border-white/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(111,102,255,0.12),0_4px_12px_rgba(0,0,0,0.04)]'
                            : isPhoneValid
                                ? 'focus-within:bg-white/25 focus-within:border-white/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(111,102,255,0.12),0_4px_12px_rgba(0,0,0,0.04)]'
                                : 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10'
                    }`}
                >
                    <Phone className={`w-4 h-4 shrink-0 ${isPhoneValid && mentorInfo.phone.length > 0 ? 'text-green-500' : 'text-text-subtle'}`} />
                    <input
                        type="tel"
                        value={mentorInfo.phone}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        className="flex-1 bg-transparent text-[#1F2F43] focus:outline-none font-medium placeholder:text-[#1F2F43]/40 text-sm"
                        placeholder="+91 9876543210"
                    />
                    {isPhoneValid && mentorInfo.phone.length > 0 && (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                </div>
                {!isPhoneValid && mentorInfo.phone.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">Enter at least 10 digits.</p>
                )}
            </FieldGroup>

            <FieldGroup label="LinkedIn URL" required={false}>
                <div
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all border border-white/30 bg-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/30 hover:border-white/40 ${
                        mentorInfo.linkedin.length === 0
                            ? 'focus-within:bg-white/25 focus-within:border-white/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(111,102,255,0.12),0_4px_12px_rgba(0,0,0,0.04)]'
                            : isLinkedInValid
                                ? 'focus-within:bg-white/25 focus-within:border-white/50 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(111,102,255,0.12),0_4px_12px_rgba(0,0,0,0.04)]'
                                : 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10'
                    }`}
                >
                    <Linkedin className={`w-4 h-4 shrink-0 ${isLinkedInValid && mentorInfo.linkedin.length > 0 ? 'text-green-500' : 'text-text-subtle'}`} />
                    <input
                        type="url"
                        value={mentorInfo.linkedin}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, linkedin: e.target.value }))}
                        className="flex-1 bg-transparent text-[#1F2F43] focus:outline-none font-medium placeholder:text-[#1F2F43]/40 text-sm"
                        placeholder="https://linkedin.com/in/your-handle"
                    />
                    {isLinkedInValid && mentorInfo.linkedin.length > 0 && (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                </div>
                {!isLinkedInValid && mentorInfo.linkedin.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">Enter a valid LinkedIn URL.</p>
                )}
            </FieldGroup>
        </div>
    );
}
