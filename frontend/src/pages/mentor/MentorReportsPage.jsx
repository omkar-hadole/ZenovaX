import { useOutletContext } from 'react-router-dom';
import ReportsView from '../../components/dashboard/mentor/ReportsView';

export default function MentorReportsPage() {
    const { loading } = useOutletContext();
    return loading ? <div className="p-12 text-center">Loading...</div> : <ReportsView />;
}
