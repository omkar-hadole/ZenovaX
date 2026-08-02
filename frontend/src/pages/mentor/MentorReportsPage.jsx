import { useOutletContext } from 'react-router-dom';
import ReportsView from '../../components/dashboard/mentor/ReportsView';
import ReportsSkeleton from '../../components/dashboard/mentor/ReportsSkeleton';

export default function MentorReportsPage() {
    const { loading } = useOutletContext();
    return loading ? <ReportsSkeleton /> : <ReportsView />;
}
