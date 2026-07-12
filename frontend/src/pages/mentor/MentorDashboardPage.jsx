import { useNavigate, useOutletContext } from 'react-router-dom';
import MentorDashboardView from '../../components/dashboard/mentor/MentorDashboardView';

export default function MentorDashboardPage() {
    const navigate = useNavigate();
    const {
        stats,
        mySessions,
        sessionRequests,
        reviewStats,
        loading,
        errors,
        fetchMySessions,
        fetchSessionRequests,
        fetchStats,
    } = useOutletContext();

    return (
        <MentorDashboardView
            stats={stats}
            mySessions={mySessions}
            sessionRequests={sessionRequests}
            reviewStats={reviewStats}
            setActiveTab={() => navigate('/mentor/sessions')}
            loading={loading}
            errors={errors}
            onRetrySessions={fetchMySessions}
            onRetryRequests={fetchSessionRequests}
            onRetryStats={fetchStats}
        />
    );
}
