import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import DashboardView from '../../components/dashboard/learner/DashboardView';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchMentors(),
                    fetchSessions(),
                    fetchMyBookings()
                ]);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await apiCall('/profile/mentors');
            setMentors(response.mentors?.slice(0, 3) || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSessions = async () => {
        try {
            const data = await apiCall('/sessions/all?limit=10'); // Fetch more to ensure we have enough after filtering
            setSessions(data.sessions || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMyBookings = async () => {
        try {
            const data = await apiCall('/sessions/my-bookings');
            setMyBookings(data.sessions || []);
        } catch (error) {
            console.error(error);
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

    if (isLoading) return <DashboardSkeleton />;

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
