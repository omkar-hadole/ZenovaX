import React from 'react';
import MentorSidebar from '../../components/dashboard/mentor/MentorSidebar';
import SessionDetailsPage from '../learner/SessionDetailsPage';

export default function MentorSessionDetailsPage() {
    return (
        <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
            </div>

            <div className="relative z-10 flex h-full w-full">
                <MentorSidebar activeTab="My Sessions" />

                <main className="flex-1 overflow-y-auto">
                    <SessionDetailsPage />
                </main>
            </div>
        </div>
    );
}
