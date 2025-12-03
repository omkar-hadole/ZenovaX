import React from 'react';
import { Phone, Linkedin } from 'lucide-react';
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
    return (
        <div className="space-y-8">
            <FieldGroup label="Skills or subjects you can teach" required description="Pick at least one focus area.">
                <div className="flex flex-wrap gap-3">
                    {mentorSkillOptions.map((skill) => (
                        <Chip key={skill} label={skill} active={mentorInfo.skills.includes(skill)} onClick={() => toggleSkill(skill)} />
                    ))}
                </div>
            </FieldGroup>

            <FieldGroup label="Phone number" required>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isPhoneValid ? 'border-gray-200 focus-within:border-[#C9C7F5] focus-within:ring-2 focus-within:ring-[#C9C7F5]/20' : 'border-red-200 bg-red-50/50'}`}>
                    <Phone className="w-5 h-5 text-gray-400" />
                    <input
                        type="tel"
                        value={mentorInfo.phone}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        className="flex-1 bg-transparent text-gray-700 focus:outline-none font-medium placeholder:text-gray-400"
                        placeholder="+91 9876543210"
                    />
                </div>
                {!isPhoneValid && mentorInfo.phone.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">Enter a valid number (at least 10 digits).</p>
                )}
            </FieldGroup>

            <FieldGroup label="LinkedIn URL" required={false}>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isLinkedInValid ? 'border-gray-200 focus-within:border-[#C9C7F5] focus-within:ring-2 focus-within:ring-[#C9C7F5]/20' : 'border-red-200 bg-red-50/50'}`}>
                    <Linkedin className="w-5 h-5 text-gray-400" />
                    <input
                        type="url"
                        value={mentorInfo.linkedin}
                        onChange={(e) => setMentorInfo((prev) => ({ ...prev, linkedin: e.target.value }))}
                        className="flex-1 bg-transparent text-gray-700 focus:outline-none font-medium placeholder:text-gray-400"
                        placeholder="https://linkedin.com/in/your-handle"
                    />
                </div>
                {!isLinkedInValid && mentorInfo.linkedin.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">Please enter a valid LinkedIn profile URL.</p>
                )}
            </FieldGroup>
        </div>
    );
}
