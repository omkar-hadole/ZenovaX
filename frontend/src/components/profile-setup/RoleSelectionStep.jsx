import React from 'react';
import { RoleOption } from './FormComponents';

export default function RoleSelectionStep({ role, handleRoleChange }) {
    return (
        <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400">
                Tell us how you plan to participate on ZenovaX. You can always update this later.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                <RoleOption
                    label="Learner"
                    description="Access curated lessons, track assignments, and book mentor sessions."
                    selected={role === 'learner'}
                    onClick={() => handleRoleChange('learner')}
                />
                <RoleOption
                    label="Mentor"
                    description="Guide learners, host 1:1 sessions, and publish structured learning paths."
                    selected={role === 'mentor'}
                    onClick={() => handleRoleChange('mentor')}
                />
            </div>
        </div>
    );
}
