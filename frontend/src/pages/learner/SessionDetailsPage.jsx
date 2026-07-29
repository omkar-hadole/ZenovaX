import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import SessionDetailsView from '../../components/dashboard/learner/SessionDetailsView';
import SessionDetailsSkeleton from '../../components/dashboard/learner/SessionDetailsSkeleton';
import InlineError from '../../components/InlineError';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { openRazorpayCheckout } from '../../utils/razorpay';

export default function SessionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const { user } = useAuth();
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

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

    const markBooked = () => {
        setSession(prev => ({
            ...prev,
            isBooked: true,
            availableSeats: prev.availableSeats - 1
        }));
        setToast({ message: 'Registration confirmed!', type: 'success' });
    };

    const handleRegister = async () => {
        if (!session) return;
        setIsRegistering(true);
        try {
            const res = await apiCall(`/sessions/book/${session.id}`, { method: 'POST' });

            // Paid session with a live gateway: complete checkout, then verify.
            if (res?.requiresPayment) {
                const payment = await openRazorpayCheckout({
                    keyId: res.keyId,
                    order: res.order,
                    name: 'ZenovaX',
                    description: session.title,
                    prefill: { name: user?.name, email: user?.email },
                });
                await apiCall('/sessions/verify-payment', {
                    method: 'POST',
                    body: JSON.stringify({
                        bookingId: res.bookingId,
                        razorpayPaymentId: payment.razorpay_payment_id,
                        razorpayOrderId: payment.razorpay_order_id,
                        razorpaySignature: payment.razorpay_signature,
                    }),
                });
                markBooked();
                return;
            }

            // Free session or simulated flow — booking already confirmed server-side.
            markBooked();
        } catch (error) {
            setToast({ message: error.message || 'Registration failed', type: 'error' });
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
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
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
        <>
            <SessionDetailsView
                session={session}
                onBack={() => navigate(-1)}
                onRegister={() => setShowConfirm(true)}
                isRegistering={isRegistering}
                user={user || {}}
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={showConfirm}
                title="Confirm Registration"
                message={`You are about to register for "${session.title}". Would you like to proceed?`}
                confirmText="Register"
                type="default"
                onConfirm={() => {
                    setShowConfirm(false);
                    handleRegister();
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
