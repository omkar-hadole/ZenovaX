import { useOutletContext } from 'react-router-dom';
import MySessions from '../../components/dashboard/mentor/MySessions';
import MentorSessionsSkeleton from '../../components/dashboard/mentor/MentorSessionsSkeleton';
import InlineError from '../../components/InlineError';

export default function MentorSessionsPage() {
    const { mySessions, sessionRequests, loading, errors, fetchMySessions, fetchSessionRequests } = useOutletContext();

    if (loading) {
        return <MentorSessionsSkeleton />;
    }

    if (errors.sessions || errors.requests) {
        return (
            <InlineError
                message={errors.sessions || errors.requests}
                onRetry={() => {
                    if (errors.sessions) fetchMySessions();
                    if (errors.requests) fetchSessionRequests();
                }}
            />
        );
    }

    return (
        <MySessions sessions={[
            ...mySessions,
            ...sessionRequests.filter(req => req.status === 'PENDING').map(req => ({
                id: `req-${req.id}`,
                title: req.title,
                scheduledAt: req.proposedDate,
                duration: req.duration,
                mode: req.mode,
                isRequest: true,
                status: req.status,
                _count: { bookings: 0 }
            }))
        ].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))} />
    );
}
