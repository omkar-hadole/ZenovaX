import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import SessionDetailsView from '../../components/dashboard/learner/SessionDetailsView';
import SessionDetailsSkeleton from '../../components/dashboard/learner/SessionDetailsSkeleton';

export default function SessionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        const fetchSessionDetails = async () => {
            setIsLoading(true);
            try {
                const data = await apiCall(`/sessions/${id}`);
                setSession(data.session);
            } catch (error) {
                console.error("Failed to fetch session details", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchSessionDetails();
        }
    }, [id]);

    const handleRegister = async () => {
        if (!session) return;
        setIsRegistering(true);
        try {
            await apiCall(`/sessions/book/${session.id}`, { method: 'POST' });

            setSession(prev => ({
                ...prev,
                isBooked: true,
                availableSeats: prev.availableSeats - 1
            }));

            alert('Registration confirmed!');
        } catch (error) {
            alert(error.message || 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    if (isLoading) return <SessionDetailsSkeleton />;
    if (!session) return <div className="p-8 text-center">Session not found</div>;

    return (
        <SessionDetailsView
            session={session}
            onBack={() => navigate(-1)}
            onRegister={handleRegister}
            isRegistering={isRegistering}
            user={user}
        />
    );
}
