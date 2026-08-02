import { useOutletContext } from 'react-router-dom';
import EarningsView from '../../components/dashboard/mentor/EarningsView';
import EarningsSkeleton from '../../components/dashboard/mentor/EarningsSkeleton';

export default function MentorEarningsPage() {
    const { loading } = useOutletContext();
    return loading ? <EarningsSkeleton /> : <EarningsView />;
}
