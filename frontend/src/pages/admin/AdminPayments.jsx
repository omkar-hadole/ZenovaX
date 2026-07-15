import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import {
    Wallet, Clock, Banknote, ShieldCheck, Check, X, Landmark, TrendingUp, AlertCircle, Trophy
} from 'lucide-react';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const KYC_BADGE = {
    NOT_SUBMITTED: 'bg-gray-100 text-gray-600 border-gray-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    VERIFIED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
};

const PAYOUT_BADGE = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
    PAID: 'bg-green-50 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-600 border-red-200',
};

// Small modal that collects a free-text reason (for KYC reject / payout fail / mark paid ref).
function ReasonModal({ isOpen, title, label, placeholder, confirmText, onConfirm, onCancel }) {
    const [value, setValue] = useState('');
    useEffect(() => { if (isOpen) setValue(''); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                <label className="text-sm font-medium text-gray-600">{label}</label>
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#7A79E6] outline-none resize-none"
                />
                <div className="flex gap-3 mt-4">
                    <button onClick={() => onConfirm(value)} className="flex-1 bg-[#7A79E6] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#6c6bd6] transition-colors">
                        {confirmText}
                    </button>
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminPayments() {
    const [tab, setTab] = useState('kyc');
    const [overview, setOverview] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [reasonModal, setReasonModal] = useState({ isOpen: false });

    const fetchAll = useCallback(async () => {
        try {
            const [ov, acc, po, lb] = await Promise.all([
                apiCall('/admin/payments/overview'),
                apiCall('/admin/payout-accounts'),
                apiCall('/admin/payouts'),
                apiCall('/admin/payments/leaderboard'),
            ]);
            setOverview(ov.overview);
            setAccounts(acc.accounts || []);
            setPayouts(po.payouts || []);
            setLeaderboard(lb.leaderboard || []);
        } catch (error) {
            console.error('Failed to load payments admin data', error);
            setToast({ message: error.message || 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const runAction = async (fn, successMsg) => {
        try {
            await fn();
            setToast({ message: successMsg, type: 'success' });
            await fetchAll();
        } catch (error) {
            setToast({ message: error.message || error.error || 'Action failed', type: 'error' });
        }
    };

    const verifyAccount = (acc) => setConfirmModal({
        isOpen: true,
        title: 'Verify Payout Account',
        message: `Confirm you've reviewed ${acc.mentor?.name}'s bank/UPI details and want to mark them VERIFIED?`,
        confirmText: 'Verify',
        type: 'info',
        onConfirm: () => {
            setConfirmModal({ isOpen: false });
            runAction(() => apiCall(`/admin/payout-accounts/${acc.id}/verify`, 'POST'), 'Account verified');
        },
    });

    const rejectAccount = (acc) => setReasonModal({
        isOpen: true,
        title: `Reject ${acc.mentor?.name}'s account`,
        label: 'Reason (shown to the mentor)',
        placeholder: 'e.g. Account name does not match registered name',
        confirmText: 'Reject account',
        onConfirm: (reason) => {
            setReasonModal({ isOpen: false });
            runAction(() => apiCall(`/admin/payout-accounts/${acc.id}/reject`, 'POST', { reason }), 'Account rejected');
        },
    });

    const markPaid = (p) => setReasonModal({
        isOpen: true,
        title: `Mark ${formatCurrency(p.amount)} payout as paid`,
        label: 'Bank/UPI transfer reference (optional)',
        placeholder: 'e.g. NEFT UTR number',
        confirmText: 'Mark as paid',
        onConfirm: (ref) => {
            setReasonModal({ isOpen: false });
            runAction(() => apiCall(`/admin/payouts/${p.id}/mark-paid`, 'POST', { gatewayPayoutId: ref }), 'Payout marked as paid');
        },
    });

    const markFailed = (p) => setReasonModal({
        isOpen: true,
        title: `Mark ${formatCurrency(p.amount)} payout as failed`,
        label: 'Failure reason (funds return to mentor balance)',
        placeholder: 'e.g. Bank transfer bounced',
        confirmText: 'Mark as failed',
        onConfirm: (reason) => {
            setReasonModal({ isOpen: false });
            runAction(() => apiCall(`/admin/payouts/${p.id}/mark-failed`, 'POST', { reason }), 'Payout marked as failed');
        },
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const pendingAccounts = accounts.filter(a => a.kycStatus === 'PENDING');
    const pendingPayouts = payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');

    const stats = [
        { label: 'Platform Revenue', value: formatCurrency(overview?.platformRevenue), icon: TrendingUp, tint: 'bg-indigo-50 text-indigo-600' },
        { label: 'Owed to Mentors', value: formatCurrency((overview?.mentorPendingBalance || 0) + (overview?.mentorAvailableBalance || 0)), icon: Wallet, tint: 'bg-green-50 text-green-600' },
        { label: 'Pending KYC', value: overview?.pendingKycCount ?? 0, icon: ShieldCheck, tint: 'bg-yellow-50 text-yellow-600' },
        { label: 'Pending Payouts', value: `${overview?.pendingPayoutsCount ?? 0} · ${formatCurrency(overview?.pendingPayoutsAmount)}`, icon: Banknote, tint: 'bg-orange-50 text-orange-600' },
    ];

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Payments & Payouts</h1>
                <p className="text-gray-500 mt-1">Verify mentor payout accounts and release withdrawals</p>
            </header>

            {/* Overview stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.tint}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-6">
                <button
                    onClick={() => setTab('kyc')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'kyc' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    KYC Requests {pendingAccounts.length > 0 && <span className="ml-1 text-xs bg-yellow-400 text-white px-1.5 py-0.5 rounded-full">{pendingAccounts.length}</span>}
                </button>
                <button
                    onClick={() => setTab('payouts')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'payouts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Payout Requests {pendingPayouts.length > 0 && <span className="ml-1 text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded-full">{pendingPayouts.length}</span>}
                </button>
                <button
                    onClick={() => setTab('leaderboard')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'leaderboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Top Mentors
                </button>
            </div>

            {tab === 'kyc' && <KycList accounts={accounts} onVerify={verifyAccount} onReject={rejectAccount} />}
            {tab === 'payouts' && <PayoutList payouts={payouts} onMarkPaid={markPaid} onMarkFailed={markFailed} />}
            {tab === 'leaderboard' && <Leaderboard rows={leaderboard} />}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false })}
            />
            <ReasonModal
                {...reasonModal}
                onCancel={() => setReasonModal({ isOpen: false })}
            />
        </div>
    );
}

function KycList({ accounts, onVerify, onReject }) {
    if (accounts.length === 0) {
        return <EmptyState icon={ShieldCheck} title="No payout accounts" subtitle="Mentors haven't submitted any bank/UPI details yet." />;
    }
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="font-bold text-gray-900">{acc.mentor?.name}</p>
                            <p className="text-xs text-gray-500">{acc.mentor?.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${KYC_BADGE[acc.kycStatus]}`}>{acc.kycStatus}</span>
                    </div>
                    <div className="space-y-2 text-sm bg-gray-50 rounded-2xl p-4 mb-4">
                        <Row label="Holder" value={acc.accountHolderName || '—'} />
                        {acc.bankAccountNumber && <Row label="Bank A/C" value={acc.bankAccountNumber} />}
                        {acc.ifscCode && <Row label="IFSC" value={acc.ifscCode} />}
                        {acc.upiId && <Row label="UPI" value={acc.upiId} />}
                    </div>
                    {acc.kycStatus === 'REJECTED' && acc.rejectionReason && (
                        <p className="text-xs text-red-500 mb-4 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{acc.rejectionReason}</p>
                    )}
                    {acc.kycStatus === 'PENDING' ? (
                        <div className="flex gap-3">
                            <button onClick={() => onVerify(acc)} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" /> Verify
                            </button>
                            <button onClick={() => onReject(acc)} className="flex-1 bg-white text-red-500 border border-red-100 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> Reject
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400">
                            {acc.kycStatus === 'VERIFIED' ? 'Verified' : 'Rejected'}
                            {acc.verifiedAt ? ` · ${new Date(acc.verifiedAt).toLocaleDateString()}` : ''}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function PayoutList({ payouts, onMarkPaid, onMarkFailed }) {
    if (payouts.length === 0) {
        return <EmptyState icon={Landmark} title="No payout requests" subtitle="Mentors haven't requested any withdrawals yet." />;
    }
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Mentor</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Requested</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{p.mentor?.name}</p>
                                    <p className="text-xs text-gray-500">{p.mentor?.email}</p>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(p.amount)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.requestedAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PAYOUT_BADGE[p.status]}`}>{p.status}</span>
                                    {p.status === 'FAILED' && p.failureReason && <p className="text-xs text-red-500 mt-1">{p.failureReason}</p>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {(p.status === 'PENDING' || p.status === 'PROCESSING') ? (
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => onMarkPaid(p)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800">Mark Paid</button>
                                            <button onClick={() => onMarkFailed(p)} className="bg-white text-red-500 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50">Fail</button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">{p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const RANK_ACCENT = [
    'bg-yellow-100 text-yellow-700', // 1st — gold
    'bg-gray-200 text-gray-700',     // 2nd — silver
    'bg-orange-100 text-orange-700', // 3rd — bronze
];

function Leaderboard({ rows }) {
    if (rows.length === 0) {
        return <EmptyState icon={Trophy} title="No earnings yet" subtitle="Mentors will rank here once paid sessions start earning." />;
    }
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Mentor</th>
                            <th className="px-6 py-4">Total Earned</th>
                            <th className="px-6 py-4">Available</th>
                            <th className="px-6 py-4">Paid Out</th>
                            <th className="px-6 py-4">Sessions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((row, i) => (
                            <tr key={row.mentor.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${RANK_ACCENT[i] || 'bg-gray-100 text-gray-500'}`}>
                                        {i + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{row.mentor.name}</p>
                                    <p className="text-xs text-gray-500">{row.mentor.email}</p>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(row.totalEarned)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(row.balanceAvailable)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(row.totalPaidOut)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{row.mentor.totalSessions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const Row = ({ label, value }) => (
    <div className="flex justify-between">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-800">{value}</span>
    </div>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500">{subtitle}</p>
    </div>
);
