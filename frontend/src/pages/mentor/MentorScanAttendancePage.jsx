import { useOutletContext } from 'react-router-dom';
import ScanAttendanceView from '../../components/dashboard/mentor/ScanAttendanceView';

export default function MentorScanAttendancePage() {
    const { setShowScanner } = useOutletContext();
    return <ScanAttendanceView onOpenScanner={() => setShowScanner(true)} />;
}
