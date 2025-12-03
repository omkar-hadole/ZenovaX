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
                // We need an endpoint to get a single session by ID
                // Assuming /sessions/:id exists or we use /sessions/all and filter (bad)
                // Let's assume we need to add GET /sessions/:id to backend if it doesn't exist
                // Or use the existing list endpoint if it supports filtering by ID
                // Ideally, we should have a dedicated endpoint.
                // For now, let's try to fetch all and find (temporary) or better, implement the endpoint.
                // Wait, I should check if GET /sessions/:id exists.
                // Looking at sessionController.js, there is no getSessionById.
                // I will implement it in the backend shortly.
                // For now, I'll assume it exists: GET /api/sessions/:id
                const data = await apiCall(`/sessions/${id}`);
                setSession(data.session);
            } catch (error) {
                console.error("Failed to fetch session details", error);
                // navigate('/sessions'); // Redirect if not found?
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

            // Update local state
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
