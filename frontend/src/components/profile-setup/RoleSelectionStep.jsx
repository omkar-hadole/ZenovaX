import { BookOpen, Users, Check } from 'lucide-react';

const OPTIONS = [
    {
        value: 'learner',
        label: 'Learner',
        icon: BookOpen,
        description: 'Access curated lessons, book 1:1 mentor sessions, and track your progress.',
    },
    {
        value: 'mentor',
        label: 'Mentor',
        icon: Users,
        description: 'Guide learners, host sessions, share expertise, and earn rewards.',
    },
];

export default function RoleSelectionStep({ role, handleRoleChange }) {
    return (
        <div className="grid gap-3">
            {OPTIONS.map((opt) => {
                const selected = role === opt.value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleRoleChange(opt.value)}
                        className={`relative flex items-center gap-4 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                            selected
                                ? 'border-[#6F66FF] bg-[#6F66FF]/5'
                                : 'border-border bg-surface hover:border-[#6F66FF]/30 hover:bg-surface-2 hover:shadow-sm'
                        } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6F66FF]`}
                    >
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                                selected
                                    ? 'bg-[#6F66FF] text-white'
                                    : 'bg-surface-2 text-text-subtle group-hover:text-[#6F66FF]'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <span className="text-base font-bold text-text block">
                                {opt.label}
                            </span>
                            <p className="text-sm text-text-muted leading-snug mt-0.5">
                                {opt.description}
                            </p>
                        </div>

                        <div
                            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                                selected
                                    ? 'border-[#6F66FF] bg-[#6F66FF]'
                                    : 'border-border group-hover:border-[#6F66FF]/40'
                            }`}
                        >
                            {selected && (
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
