import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import LearnerLayout from './layouts/LearnerLayout';
import DashboardPage from './pages/learner/DashboardPage';
import SessionsPage from './pages/learner/SessionsPage';
import SessionDetailsPage from './pages/learner/SessionDetailsPage';
import BookingsPage from './pages/learner/BookingsPage';
import ComingSoonPage from './pages/learner/ComingSoonPage';
import HelpCenter from './pages/learner/HelpCenter';
import Zen from './pages/learner/Zen';

import MentorDashboard from './pages/MentorDashboard';
import CompleteProfile from './pages/CompleteProfile';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import DesktopOnlyGuard from './components/DesktopOnlyGuard';

import MentorsList from './pages/MentorsList';

import CreateSession from './pages/CreateSession';
import LaunchQuiz from './pages/LaunchQuiz';
import QuizAttempt from './pages/QuizAttempt';
import LiveSession from './pages/LiveSession';
import UploadResource from './pages/UploadResource';
import AttemptCodingQuestion from './pages/learner/AttemptCodingQuestion';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingSessions from './pages/admin/PendingSessions';
import AllSessions from './pages/admin/AllSessions';
import UsersList from './pages/admin/UsersList';
import Reports from './pages/admin/Reports';
import MentorSessionDetailsPage from './pages/mentor/MentorSessionDetailsPage';

function App() {
    const { user } = useAuth();

    useEffect(() => {
        const fetchCsrfToken = async () => {
            if (user) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/csrf`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (data.csrfToken) {
                        localStorage.setItem('csrfToken', data.csrfToken);
                    }
                } catch (error) {
                    console.error("Failed to bootstrap CSRF token:", error);
                }
            }
        };
        fetchCsrfToken();
    }, [user]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />

                <Route
                    path="/complete-profile"
                    element={
                        <ProtectedRoute>
                            <DesktopOnlyGuard>
                                <CompleteProfile />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute allowedRoles={['LEARNER']}>
                            <DesktopOnlyGuard>
                                <LearnerLayout />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="sessions" element={<SessionsPage />} />
                    <Route path="sessions/:id" element={<SessionDetailsPage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="mentors" element={<MentorsList />} />
                    <Route path="help" element={<HelpCenter />} />
                    <Route path="zen" element={<Zen />} />
                    <Route path="settings" element={<ComingSoonPage />} />
                </Route>

                <Route
                    path="/mentor-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}>
                            <DesktopOnlyGuard>
                                <MentorDashboard />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <DesktopOnlyGuard>
                                <Profile />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/:id"
                    element={
                        <ProtectedRoute>
                            <DesktopOnlyGuard>
                                <Profile />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                />


                <Route path="/mentor/create-session" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><DesktopOnlyGuard><CreateSession /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/mentor/session/:id" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><DesktopOnlyGuard><MentorSessionDetailsPage /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/mentor/edit-session/:id" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH', 'ADMIN']}><DesktopOnlyGuard><CreateSession /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/mentor/upload-resource" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><DesktopOnlyGuard><UploadResource /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/mentor/launch-quiz" element={<ProtectedRoute allowedRoles={['MENTOR', 'BOTH']}><DesktopOnlyGuard><LaunchQuiz /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/quiz/:id/attempt" element={<ProtectedRoute><DesktopOnlyGuard><QuizAttempt /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route path="/coding/:id/attempt" element={<ProtectedRoute><DesktopOnlyGuard><AttemptCodingQuestion /></DesktopOnlyGuard></ProtectedRoute>} />
                <Route
                    path="/session/:id/live"
                    element={
                        <ProtectedRoute>
                            <DesktopOnlyGuard>
                                <LiveSession />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <DesktopOnlyGuard>
                                <AdminLayout />
                            </DesktopOnlyGuard>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="pending-sessions" element={<PendingSessions />} />
                    <Route path="all-sessions" element={<AllSessions />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<ComingSoonPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;