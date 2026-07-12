import { useNavigate, useOutletContext } from 'react-router-dom';
import LaunchCodingQuestion from '../LaunchCodingQuestion';

export default function MentorLaunchCodePage() {
    const navigate = useNavigate();
    const { mySessions } = useOutletContext();
    return <LaunchCodingQuestion mySessions={mySessions} setActiveTab={() => navigate('/mentor/dashboard')} />;
}
