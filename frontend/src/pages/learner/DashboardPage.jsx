import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import DashboardView from '../../components/dashboard/learner/DashboardView';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import InlineError from '../../components/InlineError';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchMentors(),
                fetchSessions(),
                fetchMyBookings()
            ]);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await apiCall('/profile/mentors');
            setMentors(response.mentors?.slice(0, 3) || []);
        } catch (err) {
            console.error(err);
            throw new Error("Failed to load mentors");
        }
    };

    const fetchSessions = async () => {
        try {
            const data = await apiCall('/sessions/all?limit=10');
            setSessions(data.sessions || []);
        } catch (err) {
            console.error(err);
            throw new Error("Failed to load sessions");
        }
    };

    const fetchMyBookings = async () => {
        try {
            const data = await apiCall('/sessions/my-bookings');
            setMyBookings(data.sessions || []);
        } catch (err) {
            console.error(err);
            throw new Error("Failed to load bookings");
        }
    };

    const setSelectedSession = (session) => {
        if (session) {
            navigate(`/sessions/${session.id}`);
        }
    };

    const setActiveTab = (tab) => {
        if (tab === 'Browse Sessions') navigate('/sessions');
        if (tab === 'My Bookings') navigate('/bookings');
    };

    if (isLoading) return <div className="p-4 sm:p-6"><DashboardSkeleton /></div>;

    if (error) {
        return (
            <div className="p-8">
                <InlineError message={error} onRetry={loadData} />
            </div>
        );
    }

    return (
        <DashboardView
            myBookings={myBookings}
            sessions={sessions}
            mentors={mentors}
            setActiveTab={setActiveTab}
            setSelectedSession={setSelectedSession}
        />
    );
}
