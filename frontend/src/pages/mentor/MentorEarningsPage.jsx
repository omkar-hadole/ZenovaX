import { useOutletContext } from 'react-router-dom';
import EarningsView from '../../components/dashboard/mentor/EarningsView';

export default function MentorEarningsPage() {
    const { loading } = useOutletContext();
    return loading ? <div className="p-12 text-center">Loading...</div> : <EarningsView />;
}
