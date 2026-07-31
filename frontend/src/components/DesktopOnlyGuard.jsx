import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Keyboard, Columns2, SquareTerminal, Command, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
    { icon: Keyboard, label: 'Full keyboard support' },
    { icon: Columns2, label: 'Split editor layout' },
    { icon: SquareTerminal, label: 'Live console & test cases' },
    { icon: Command, label: 'Keyboard shortcuts' },
];

const CODE_LINES = [
    { indent: '', parts: [['k', 'function '], ['f', 'solve'], ['p', '(nums) {']] },
    { indent: '  ', parts: [['k', 'const '], ['v', 'total'], ['p', ' = '], ['s', '0'], ['p', ';']] },
    { indent: '  ', parts: [['k', 'for'], ['p', ' (let '], ['v', 'i'], ['p', ' of '], ['v', 'nums'], ['p', ') '], ['c', 'total'], ['p', ' += '], ['v', 'i'], ['p', ';']] },
    { indent: '  ', parts: [['k', 'return '], ['v', 'total'], ['p', ';']] },
    { indent: '', parts: [['p', '}']] },
];

const TERMINAL_LINES = [
    { prefix: '✓', text: '4/4 test cases passed', className: 'text-emerald-400' },
    { prefix: '→', text: 'runtime 42ms · memory 48.2MB', className: 'text-slate-400' },
];

function CodeLine({ line }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-right font-mono text-[9px] leading-4 text-white/25 select-none">{line.number}</span>
            <span className="whitespace-pre font-mono text-[10px] leading-4 sm:text-[11px] sm:leading-5 tracking-tight">
                {line.indent}
                {line.parts.map(([tone, text], i) => (
                    <span key={i} className={
                        tone === 'k' ? 'text-[#8B8BF8]'
                        : tone === 'f' ? 'text-[#6EA8FF]'
                        : tone === 'v' ? 'text-[#7FD1A0]'
                        : tone === 's' ? 'text-[#F2A06E]'
                        : tone === 'c' ? 'text-[#8F8FB0]'
                        : 'text-white/70'
                    }>{text}</span>
                ))}
            </span>
        </div>
    );
}

function WorkspaceIllustration() {
    return (
        <div className="relative anim-float" aria-hidden="true">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#5B5BF7]/25 via-transparent to-[#8B6CF7]/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl bg-[#0E0E1A] ring-1 ring-white/10 shadow-[0_24px_60px_-20px_rgba(20,20,40,0.45)]">
                <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-3 rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-white/60">solution.js</span>
                    <span className="ml-auto hidden rounded-md bg-[#5B5BF7]/20 px-2 py-0.5 font-mono text-[9px] font-medium text-[#A5A5FF] sm:block">⌘⇧↵ Run</span>
                </div>
                <div className="px-4 py-3 sm:px-5 sm:py-4">
                    {CODE_LINES.map((line, i) => (
                        <CodeLine key={i} line={{ ...line, number: i + 1 }} />
                    ))}
                </div>
                <div className="border-t border-white/[0.07] bg-black/30 px-4 py-2.5 sm:px-5">
                    {TERMINAL_LINES.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-[9px] leading-4 sm:text-[10px]">
                            <span className={l.className}>{l.prefix}</span>
                            <span className="text-white/70">{l.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DesktopOnlyGuard({ children }) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F6F7FB] px-4 py-10 sm:px-6 dark:bg-[#08080F]">
                <div className="anim-blob pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#5B5BF7]/20 blur-3xl dark:bg-[#5B5BF7]/15" />
                <div className="anim-blob pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-[#8B6CF7]/20 blur-3xl dark:bg-[#8B6CF7]/15" />

                <div className="anim-rise relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_-24px_rgba(24,24,50,0.18)] backdrop-blur-2xl sm:p-8 dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]">
                    <WorkspaceIllustration />

                    <div className="anim-rise anim-rise-delay-1 mt-7 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5B5BF7]/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#5B5BF7] dark:bg-[#5B5BF7]/20 dark:text-[#A5A5FF]">
                            <Sparkles size={12} strokeWidth={2.5} />
                            Coding Playground
                        </span>

                        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px] dark:text-gray-100">
                            Code, test &amp; debug on a larger screen
                        </h1>
                        <p className="mx-auto mt-2.5 max-w-[34ch] text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            The coding workspace is built for desktop. Open it on a laptop for the full experience.
                        </p>
                    </div>

                    <div className="anim-rise anim-rise-delay-2 mt-7">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                            Optimized for Desktop
                        </h2>
                        <ul className="mt-3 divide-y divide-black/[0.05] dark:divide-white/[0.07]">
                            {FEATURES.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-3.5 py-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5B5BF7]/10 text-[#5B5BF7] dark:bg-[#5B5BF7]/20 dark:text-[#A5A5FF]">
                                        <Icon size={16} strokeWidth={2.2} />
                                    </span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="anim-rise anim-rise-delay-3 mt-7">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#5B5BF7] to-[#6D5EF7] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(91,91,247,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-10px_rgba(91,91,247,0.7)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B5BF7]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#08080F]"
                        >
                            Go Back
                            <ArrowRight
                                size={17}
                                strokeWidth={2.5}
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                            />
                        </button>
                        <p className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                            Supports macOS · Windows · Linux
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
