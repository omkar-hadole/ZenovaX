import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await apiCall('/auth/verify-email', {
                    method: 'POST',
                    body: JSON.stringify({ token })
                });
                setStatus('success');
                setMessage('Email verified successfully! You can now login.');
            } catch (err) {
                setStatus('error');
                setMessage(err.message || 'Verification failed. Link may be expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#F4F4F9] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    {status === 'verifying' && <Loader2 className="w-16 h-16 text-[#7A79E6] animate-spin" />}
                    {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
                    {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {status === 'verifying' && 'Verifying Email'}
                    {status === 'success' && 'Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                <p className="text-gray-500 mb-8">{message}</p>

                {status !== 'verifying' && (
                    <button
                        onClick={() => navigate('/auth?mode=login')}
                        className="w-full bg-[#7A79E6] text-white py-3.5 rounded-xl font-bold hover:bg-[#6b6ad6] transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'success' ? 'Go to Login' : 'Back to Login'}
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                )}
            </div>
        </div>
    );
}
