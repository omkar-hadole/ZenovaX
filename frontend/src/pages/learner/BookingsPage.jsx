import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import MyBookingsView from '../../components/dashboard/learner/MyBookingsView';

export default function BookingsPage() {
    const navigate = useNavigate();
    const [myBookings, setMyBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMyBookings = async () => {
            setIsLoading(true);
            try {
                const data = await apiCall('/sessions/my-bookings');
                setMyBookings(data.sessions || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
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

    return (
        <MyBookingsView
            myBookings={myBookings}
            isLoading={isLoading}
            setSelectedSession={setSelectedSession}
            setActiveTab={setActiveTab}
        />
    );
}
