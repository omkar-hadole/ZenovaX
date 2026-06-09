import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import MyBookingsView from '../../components/dashboard/learner/MyBookingsView';
import InlineError from '../../components/InlineError';

export default function BookingsPage() {
    const navigate = useNavigate();
    const [myBookings, setMyBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMyBookings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiCall('/sessions/my-bookings');
            const sortedSessions = (data.sessions || []).sort((a, b) =>
                new Date(b.scheduledAt) - new Date(a.scheduledAt)
            );
            setMyBookings(sortedSessions);
        } catch (error) {
            console.error(error);
            setError(error.message || 'Failed to fetch bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const setSelectedSession = (session) => {
        if (session) {
            navigate(`/sessions/${session.id}`);
        }
    };

    const setActiveTab = (tab) => {
        if (tab === 'Browse Sessions') navigate('/sessions');
    };

    if (isLoading) {
        return (
            <MyBookingsView
                myBookings={[]}
                isLoading={true}
                setSelectedSession={setSelectedSession}
                setActiveTab={setActiveTab}
            />
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <InlineError message={error} onRetry={fetchMyBookings} />
            </div>
        );
    }

    return (
        <MyBookingsView
            myBookings={myBookings}
            isLoading={isLoading}
            setSelectedSession={setSelectedSession}
            setActiveTab={setActiveTab}
        />
    );
}
