import { BookOpen, Users, Check } from 'lucide-react';

const OPTIONS = [
    {
        value: 'learner',
        label: 'Learner',
        icon: BookOpen,
        description: 'Learn from peers, join sessions with resources, quizzes & coding practice.',
    },
    {
        value: 'mentor',
        label: 'Mentor',
        icon: Users,
        description: 'Host sessions, share resources & quizzes, and earn rewards.',
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
                        className={`relative flex items-center gap-4 rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer ${
                            selected
                                ? 'border-[#6F66FF] bg-[#6F66FF]/10'
                                : 'border-white/30 bg-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/30 hover:border-white/40'
                        } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6F66FF]`}
                    >
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                                selected
                                    ? 'bg-[#6F66FF] text-white'
                                    : 'bg-white/30 backdrop-blur-md text-[#1F2F43]'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <span className="text-base font-bold block"
                                style={{ color: '#1F2F43' }}>
                                {opt.label}
                            </span>
                            <p className="text-sm leading-snug mt-0.5"
                                style={{ color: '#1F2F43' }}>
                                {opt.description}
                            </p>
                        </div>

                        <div
                            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                                selected
                                    ? 'border-[#6F66FF] bg-[#6F66FF]'
                                    : 'border-white/40'
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
