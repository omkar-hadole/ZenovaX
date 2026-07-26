import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon, Shield, AlertTriangle, Loader2, Lock, Phone, X, Palette, Info, Smartphone, LogOut } from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';

const CARD = "bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800";

// Mirrors backend/services/profileService.js's formatPhoneNumber so the
// preview here matches exactly what other users will actually see.
const formatPhoneNumber = (phone, visible) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');

    let base = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
        base = digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
        base = digits.substring(1);
    } else if (digits.length > 10) {
        base = digits.substring(digits.length - 10);
    }

    if (base.length === 10) {
        const part1 = base.substring(0, 5);
        if (visible) {
            const part2 = base.substring(5);
            return `+91 ${part1} ${part2}`;
        }
        return `+91 ${part1} *****`;
    }

    if (visible) {
        return phone.startsWith('+') ? phone : `+91 ${phone}`;
    }
    const displayLength = Math.max(1, phone.length - 5);
    return `+91 ${phone.substring(0, displayLength)}*****`;
};

export default function Settings() {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const [toast, setToast] = useState(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [isPhoneVisible, setIsPhoneVisible] = useState(user?.isPhoneVisible ?? true);
    const [privacyLoading, setPrivacyLoading] = useState(false);

    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deactivateLoading, setDeactivateLoading] = useState(false);

    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [revokingAll, setRevokingAll] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            const data = await apiCall('/auth/sessions');
            setSessions(data.sessions);
        } catch {
            // silently fail
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleRevoke = async (id) => {
        setRevokingId(id);
        try {
            const data = await apiCall(`/auth/sessions/${id}`, { method: 'DELETE' });
            if (data.currentSessionRevoked) {
                setToast({ message: 'Session revoked. Redirecting...', type: 'success' });
                localStorage.removeItem('user');
                localStorage.removeItem('csrfToken');
                setTimeout(() => navigate('/auth'), 1000);
                return;
            }
            setSessions(prev => prev.filter(s => s.id !== id));
            setToast({ message: 'Session revoked', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to revoke session', type: 'error' });
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeAll = async () => {
        setRevokingAll(true);
        try {
            await apiCall('/auth/sessions', { method: 'DELETE' });
            setSessions(prev => prev.filter(s => !s.isCurrent));
            setToast({ message: 'Other sessions revoked', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to revoke sessions', type: 'error' });
        } finally {
            setRevokingAll(false);
        }
    };

    const formatDate = (d) => {
        const date = new Date(d);
        return date.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const parseDeviceName = (ua) => {
        if (!ua) return 'Unknown device';
        let name = '';
        if (ua.includes('Chrome') && !ua.includes('Edg')) name = 'Chrome';
        else if (ua.includes('Firefox')) name = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) name = 'Safari';
        else if (ua.includes('Edg')) name = 'Edge';
        else name = 'Browser';

        let os = 'Unknown OS';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
        else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        else if (ua.includes('CrOS')) os = 'ChromeOS';

        return `${name} on ${os}`;
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setToast({ message: 'New password must be at least 8 characters long', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setToast({ message: 'New passwords do not match', type: 'error' });
            return;
        }

        setPasswordLoading(true);
        try {
            await apiCall('/auth/change-password', {
                method: 'POST',
                body: { currentPassword, newPassword }
            });
            setToast({ message: 'Password changed. Redirecting you to log in again...', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(async () => {
                await logout();
                navigate('/auth');
            }, 1800);
        } catch (error) {
            setToast({ message: error.message || 'Failed to change password', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleTogglePhoneVisibility = async () => {
        const next = !isPhoneVisible;
        setIsPhoneVisible(next);
        setPrivacyLoading(true);
        try {
            const formData = new FormData();
            formData.append('isPhoneVisible', next);
            await apiCall('/profile/update', { method: 'PUT', body: formData });
            updateUser({ isPhoneVisible: next });
            setToast({ message: 'Privacy setting updated', type: 'success' });
        } catch (error) {
            setIsPhoneVisible(!next);
            setToast({ message: error.message || 'Failed to update privacy setting', type: 'error' });
        } finally {
            setPrivacyLoading(false);
        }
    };

    const handleDeactivate = async (e) => {
        e.preventDefault();
        setDeactivateLoading(true);
        try {
            await apiCall('/profile/me', { method: 'DELETE', body: { password: deactivatePassword } });
            await logout();
            navigate('/auth');
        } catch (error) {
            setToast({ message: error.message || 'Failed to deactivate account', type: 'error' });
            setDeactivateLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account, appearance, and privacy.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Appearance */}
                <section className={CARD}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Appearance
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
                            Beta
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose how ZenovaX looks on this device.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold border-2 transition-all ${theme === 'light'
                                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Sun className="w-4 h-4 flex-shrink-0" /> Light
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold border-2 transition-all ${theme === 'dark'
                                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Moon className="w-4 h-4 flex-shrink-0" /> Dark
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">Dark mode is in beta — some pages may still need polish.</p>
                    </div>
                </section>

                {/* Privacy */}
                <section className={CARD}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Privacy
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Control what other users can see on your profile.</p>
                    <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Show phone number</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Visible to other users if enabled</p>
                                </div>
                            </div>
                            <button
                                onClick={handleTogglePhoneVisibility}
                                disabled={privacyLoading}
                                aria-pressed={isPhoneVisible}
                                aria-label="Toggle phone number visibility"
                                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${isPhoneVisible ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            >
                                <span
                                    className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform duration-200 ${isPhoneVisible ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                {isPhoneVisible ? 'Others see' : 'Others see (hidden)'}
                            </span>
                            {user?.phoneNumber ? (
                                <span className={`text-sm font-mono ${isPhoneVisible ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {formatPhoneNumber(user.phoneNumber, isPhoneVisible)}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500">No phone number added yet</span>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Security */}
            <section className={CARD}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Security
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your password. You'll be logged out afterwards for security.</p>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            required
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            aria-label={showCurrent ? 'Hide password' : 'Show password'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type={showNew ? 'text' : 'password'}
                                required
                                minLength={8}
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                aria-label={showNew ? 'Hide password' : 'Show password'}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type={showNew ? 'text' : 'password'}
                                required
                                minLength={8}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
                    >
                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {passwordLoading ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </section>

            {/* Active Sessions */}
            <section className={CARD}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Active Sessions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    These are the devices currently signed into your account.
                </p>

                {sessionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : sessions.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                        No active sessions found.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {parseDeviceName(session.userAgent)}
                                        </span>
                                        {session.isCurrent && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-100 dark:border-green-500/20">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Created {formatDate(session.createdAt)}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Expires {formatDate(session.expiresAt)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRevoke(session.id)}
                                    disabled={revokingId === session.id}
                                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    aria-label="Revoke session"
                                >
                                    {revokingId === session.id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <LogOut className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                        onClick={handleRevokeAll}
                        disabled={revokingAll}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                    >
                        {revokingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        {revokingAll ? 'Revoking...' : 'Log out all other devices'}
                    </button>
                )}
            </section>

            {/* Danger zone */}
            <section className="bg-red-50 dark:bg-red-500/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-red-100 dark:border-red-500/20">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mb-6">
                    Deactivating your account will sign you out everywhere and hide your profile. This can only be reversed by contacting support.
                </p>
                <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    Deactivate Account
                </button>
            </section>

            {showDeactivateModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDeactivateModal(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirm Deactivation</h3>
                            <button
                                onClick={() => setShowDeactivateModal(false)}
                                aria-label="Close"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Enter your password to confirm. You'll be signed out immediately.
                        </p>
                        <form onSubmit={handleDeactivate} className="space-y-4">
                            <input
                                type="password"
                                required
                                autoFocus
                                placeholder="Your password"
                                value={deactivatePassword}
                                onChange={(e) => setDeactivatePassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            />
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeactivateModal(false)}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deactivateLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                                >
                                    {deactivateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {deactivateLoading ? 'Deactivating...' : 'Deactivate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
