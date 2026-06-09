import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import SessionDetailsView from '../../components/dashboard/learner/SessionDetailsView';
import SessionDetailsSkeleton from '../../components/dashboard/learner/SessionDetailsSkeleton';
import InlineError from '../../components/InlineError';

export default function SessionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [error, setError] = useState(null);

    const fetchSessionDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiCall(`/sessions/${id}`);
            setSession(data.session);
        } catch (err) {
            console.error("Failed to fetch session details", err);
            setError(err.message || "Failed to fetch session details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
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

    if (error) {
        return (
            <div className="p-8">
                <div className="mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                    >
                        &larr; Back
                    </button>
                </div>
                <InlineError message={error} onRetry={fetchSessionDetails} />
            </div>
        );
    }

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
