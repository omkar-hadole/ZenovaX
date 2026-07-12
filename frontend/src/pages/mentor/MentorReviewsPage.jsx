import { useOutletContext } from 'react-router-dom';
import ReviewsReceived from '../../components/dashboard/mentor/ReviewsReceived';
import ReviewsSkeleton from '../../components/dashboard/mentor/ReviewsSkeleton';

export default function MentorReviewsPage() {
    const { loading } = useOutletContext();
    return loading ? <ReviewsSkeleton /> : <ReviewsReceived />;
}
