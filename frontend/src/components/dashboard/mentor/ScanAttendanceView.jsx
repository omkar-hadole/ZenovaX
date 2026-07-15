import React from 'react';
import { QrCode, Ticket, Camera, CheckCircle2, ShieldCheck } from 'lucide-react';

const STEPS = [
    {
        icon: Ticket,
        color: '#A9C1F7',
        title: '1. Learner books an offline session',
        description: "They get a unique QR ticket in their booking, tied to that session.",
    },
    {
        icon: Camera,
        color: '#C9C7F5',
        title: '2. Open the scanner at the event',
        description: 'Point your camera at their QR code — no typing, no manual lookup.',
    },
    {
        icon: CheckCircle2,
        color: '#F7D483',
        title: '3. Attendance is verified instantly',
        description: 'The ticket is checked against your session and marked attended on the spot.',
    },
];

export default function ScanAttendanceView({ onOpenScanner }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-indigo-50 dark:bg-indigo-500/10 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 rounded-full bg-purple-50 dark:bg-purple-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <QrCode className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ticket Scanner</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-lg">
                        Use your camera to scan student QR codes for instant attendance verification.
                    </p>
                    <button
                        onClick={onOpenScanner}
                        className="bg-black text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
                    >
                        Open Scanner
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {STEPS.map((step, i) => (
                    <div
                        key={step.title}
                        className="bg-white dark:bg-gray-900 p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                    >
                        <div
                            className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${step.color}20` }}
                        />
                        <div className="relative z-10">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${step.color}30`, color: step.color }}
                            >
                                <step.icon className="w-5 h-5" style={{ color: step.color, filter: 'brightness(0.7)' }} />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{step.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Why scan attendance?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        For in-person sessions, this replaces manual sign-in sheets and confirms that the person
                        checking in actually holds a valid booking — so no-shows and unpaid walk-ins can't claim a seat,
                        and your session stats stay accurate.
                    </p>
                </div>
            </div>
        </div>
    );
}
