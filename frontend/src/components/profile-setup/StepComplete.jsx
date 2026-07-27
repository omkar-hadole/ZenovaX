import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export default function StepComplete({ userName }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-center">
            <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-700 ease-out ${
                    show ? 'bg-accent scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
                style={{
                    boxShadow: show ? '0 0 0 8px rgba(111, 102, 255, 0.1), 0 0 0 16px rgba(111, 102, 255, 0.04)' : 'none',
                }}
            >
                <Check
                    className={`w-9 h-9 text-text-on-accent transition-all duration-500 delay-300 ${
                        show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                    strokeWidth={3}
                />
            </div>

            <h1
                className={`text-2xl lg:text-3xl font-bold text-text transition-all duration-500 delay-500 ${
                    show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            >
                You're in, {userName.split(' ')[0]}
            </h1>
            <p
                className={`text-sm text-text-muted mt-2 max-w-xs transition-all duration-500 delay-600 ${
                    show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            >
                Your profile is ready. We're taking you to your dashboard.
            </p>

            <div className="mt-10 w-48 h-1 rounded-full bg-surface-2 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-accent transition-all duration-[2800ms] ease-linear ${
                        show ? 'w-full' : 'w-0'
                    }`}
                />
            </div>
        </div>
    );
}
