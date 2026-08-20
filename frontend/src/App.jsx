import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { trackPageView } from './utils/analytics';

import LearnerLayout from './layouts/LearnerLayout';
import AdminLayout from './layouts/AdminLayout';
import MentorLayout from './layouts/MentorLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DesktopOnlyGuard from './components/DesktopOnlyGuard';

// Lazy loaded page components
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));

const DashboardPage = lazy(() => import('./pages/learner/DashboardPage'));
const SessionsPage = lazy(() => import('./pages/learner/SessionsPage'));
const LearningRequestsPage = lazy(() => import('./pages/learner/LearningRequestsPage'));
const LearningRequestDetailsPage = lazy(() => import('./pages/learner/LearningRequestDetailsPage'));
const SessionDetailsPage = lazy(() => import('./pages/learner/SessionDetailsPage'));
const BookingsPage = lazy(() => import('./pages/learner/BookingsPage'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpCenter = lazy(() => import('./pages/learner/HelpCenter'));
const Zen = lazy(() => import('./pages/learner/Zen'));

const MentorDashboardPage = lazy(() => import('./pages/mentor/MentorDashboardPage'));
const MentorSessionsPage = lazy(() => import('./pages/mentor/MentorSessionsPage'));
const MentorLearningRequestsPage = lazy(() => import('./pages/mentor/MentorLearningRequestsPage'));
const MentorReportsPage = lazy(() => import('./pages/mentor/MentorReportsPage'));
const MentorScanAttendancePage = lazy(() => import('./pages/mentor/MentorScanAttendancePage'));
const MentorReviewsPage = lazy(() => import('./pages/mentor/MentorReviewsPage'));
const MentorLaunchCodePage = lazy(() => import('./pages/mentor/MentorLaunchCodePage'));
const MentorCodingQuestionsPage = lazy(() => import('./pages/mentor/MentorCodingQuestionsPage'));
const MentorCodingPreviewPage = lazy(() => import('./pages/mentor/MentorCodingPreviewPage'));
const MentorEarningsPage = lazy(() => import('./pages/mentor/MentorEarningsPage'));
const MentorZen = lazy(() => import('./pages/mentor/MentorZen'));
const MentorHelpCenter = lazy(() => import('./pages/mentor/MentorHelpCenter'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Profile = lazy(() => import('./pages/Profile'));

const MentorsList = lazy(() => import('./pages/MentorsList'));

const CreateSession = lazy(() => import('./pages/CreateSession'));
const LaunchQuiz = lazy(() => import('./pages/LaunchQuiz'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const QuizAttempt = lazy(() => import('./pages/QuizAttempt'));
const LiveSession = lazy(() => import('./pages/LiveSession'));
const UploadResource = lazy(() => import('./pages/UploadResource'));
const AttemptCodingQuestion = lazy(() => import('./pages/learner/AttemptCodingQuestion'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PendingSessions = lazy(() => import('./pages/admin/PendingSessions'));
const AllSessions = lazy(() => import('./pages/admin/AllSessions'));
const UsersList = lazy(() => import('./pages/admin/UsersList'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminPushNotification = lazy(() => import('./pages/admin/AdminPushNotification'));
const MentorSessionDetailsPage = lazy(() => import('./pages/mentor/MentorSessionDetailsPage'));

import CommandBar from './components/CommandBar';
import InstallPrompt from './components/InstallPrompt';
import { setCsrfToken } from './utils/api';

function AnalyticsTracker() {
    const location = useLocation();
    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location]);
    return null;
}

function App() {
    const { user } = useAuth();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/auth/csrf`, {
            credentials: 'include'
        }).then(r => r.json()).then(d => {
            if (d.csrfToken) setCsrfToken(d.csrfToken);
        }).catch(() => {});
    }, []);

    return (
        <BrowserRouter>
            <AnalyticsTracker />
            <CommandBar />
            <InstallPrompt />
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen bg-[#F5F6FA]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-[#7A79E6] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                </div>
            }>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/terms" element={<TermsAndConditions />} />

                    <Route
                        path="/complete-profile"
                        element={
                            <ProtectedRoute>
                                <CompleteProfile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute allowedRoles={['LEARNER']}>
                                <LearnerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="sessions" element={<SessionsPage />} />
                        <Route path="sessions/:id" element={<SessionDetailsPage />} />
                        <Route path="learning-requests" element={<LearningRequestsPage />} />
                        <Route path="learning-requests/:id" element={<LearningRequestDetailsPage />} />
                        <Route path="bookings" element={<BookingsPage />} />
                        <Route path="mentors" element={<MentorsList />} />
                        <Route path="help" element={<HelpCenter />} />
                        <Route path="zen" element={<Zen />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    <Route
                        path="/mentor"
                        element={
                            <ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}>
                                <MentorLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<MentorDashboardPage />} />
                        <Route path="sessions" element={<MentorSessionsPage />} />
                        <Route path="learning-requests" element={<MentorLearningRequestsPage />} />
                        <Route path="reports" element={<MentorReportsPage />} />
                        <Route path="scan-attendance" element={<MentorScanAttendancePage />} />
                        <Route path="reviews" element={<MentorReviewsPage />} />
                        <Route path="earnings" element={<MentorEarningsPage />} />
                        <Route path="launch-code" element={<MentorLaunchCodePage />} />
                        <Route path="launch-code/:id" element={<MentorLaunchCodePage />} />
                        <Route path="coding-questions" element={<MentorCodingQuestionsPage />} />
                        <Route path="help" element={<MentorHelpCenter />} />
                        <Route path="zen" element={<MentorZen />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/profile/:id"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />


                    <Route path="/mentor/create-session" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><CreateSession /></ProtectedRoute>} />
                    <Route path="/mentor/session/:id" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><MentorSessionDetailsPage /></ProtectedRoute>} />
                    <Route path="/mentor/edit-session/:id" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH', 'ADMIN']}><CreateSession /></ProtectedRoute>} />
                    <Route path="/mentor/upload-resource" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><UploadResource /></ProtectedRoute>} />
                    <Route path="/mentor/launch-quiz" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><LaunchQuiz /></ProtectedRoute>} />
                    <Route path="/mentor/quiz/:quizId/edit" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><LaunchQuiz /></ProtectedRoute>} />
                    <Route path="/mentor/quiz/:quizId/results" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><QuizResults /></ProtectedRoute>} />
                    <Route path="/quiz/:id/attempt" element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />
                    <Route path="/coding/:id/attempt" element={<ProtectedRoute><DesktopOnlyGuard><AttemptCodingQuestion /></DesktopOnlyGuard></ProtectedRoute>} />
                    <Route path="/mentor/coding-questions/:id/preview" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><DesktopOnlyGuard><MentorCodingPreviewPage /></DesktopOnlyGuard></ProtectedRoute>} />
                    <Route
                        path="/session/:id/live"
                        element={
                            <ProtectedRoute>
                                <LiveSession />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="pending-sessions" element={<PendingSessions />} />
                        <Route path="all-sessions" element={<AllSessions />} />
                        <Route path="users" element={<UsersList />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="notifications" element={<AdminPushNotification />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* 404 catch-all */}
                    <Route path="*" element={
                        <div className="flex justify-center items-center h-screen bg-[#F5F6FA]">
                            <div className="text-center">
                                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                                <p className="text-gray-500 mb-6">Page not found</p>
                                <Navigate to="/" replace />
                            </div>
                        </div>
                    } />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
