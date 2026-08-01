import React, { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    Clock,
    TrendingUp,
    Landmark,
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    ArrowDownCircle,
    ArrowUpCircle,
    Undo2,
    Unlock
} from 'lucide-react';
import { apiCall } from '../../../utils/api';
import { formatCurrency } from '../../../utils/formatCurrency';
import { FieldGroup } from '../../profile-setup/FormComponents';
import Toast from '../../Toast';
import EarningsSkeleton from './EarningsSkeleton';

const KYC_BADGES = {
    NOT_SUBMITTED: { label: 'Not submitted', className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700', Icon: ShieldQuestion },
    PENDING: { label: 'Pending verification', className: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20', Icon: Clock },
    VERIFIED: { label: 'Verified', className: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20', Icon: ShieldCheck },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20', Icon: ShieldAlert },
};

const PAYOUT_STATUS_BADGES = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    PROCESSING: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    PAID: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
    FAILED: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
};

const LEDGER_META = {
    BOOKING_CREDIT: { label: 'Booking earning', className: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10', Icon: ArrowDownCircle, sign: '+' },
    RELEASE: { label: 'Earnings released', className: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10', Icon: Unlock, sign: '' },
    PAYOUT: { label: 'Payout requested', className: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10', Icon: ArrowUpCircle, sign: '-' },
    REVERSAL: { label: 'Reversal', className: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800', Icon: Undo2, sign: '' },
};

const EMPTY_ACCOUNT_FORM = { accountHolderName: '', upiId: '' };

export default function EarningsView() {
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [payoutAccount, setPayoutAccount] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [toast, setToast] = useState(null);

    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
    const [savingAccount, setSavingAccount] = useState(false);

    const [payoutAmount, setPayoutAmount] = useState('');
    const [requestingPayout, setRequestingPayout] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [summary, accountRes, payoutsRes] = await Promise.all([
                apiCall('/wallet/me'),
                apiCall('/wallet/payout-account'),
                apiCall('/wallet/payouts'),
            ]);
            setWallet(summary.wallet);
            setLedgerEntries(summary.ledgerEntries || []);
            setPayoutAccount(accountRes.account);
            setPayouts(payoutsRes.payouts || []);
        } catch (error) {
            console.error('Failed to fetch wallet data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (payoutAccount && !isEditingAccount) {
            setAccountForm({
                accountHolderName: payoutAccount.accountHolderName || '',
                upiId: payoutAccount.upiId || '',
            });
        }
    }, [payoutAccount, isEditingAccount]);

    const handleAccountFieldChange = (e) => {
        const { name, value } = e.target;
        setAccountForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        setSavingAccount(true);
        try {
            const { account } = await apiCall('/wallet/payout-account', {
                method: 'PUT',
                body: JSON.stringify(accountForm),
            });
            setPayoutAccount(account);
            setIsEditingAccount(false);
            setToast({ message: 'Payout account submitted for verification', type: 'success' });
        } catch (error) {
            setToast({ message: error.message || 'Failed to save payout account', type: 'error' });
        } finally {
            setSavingAccount(false);
        }
    };

    const handlePayoutRequest = async (e) => {
        e.preventDefault();
        setRequestingPayout(true);
        try {
            await apiCall('/wallet/payouts', {
                method: 'POST',
                body: JSON.stringify({ amount: Number(payoutAmount) }),
            });
            setPayoutAmount('');
            setToast({ message: 'Payout requested', type: 'success' });
            await fetchAll();
        } catch (error) {
            setToast({ message: error.message || 'Failed to request payout', type: 'error' });
        } finally {
            setRequestingPayout(false);
        }
    };

    if (loading) {
        return <EarningsSkeleton />;
    }

    const kyc = KYC_BADGES[payoutAccount?.kycStatus || 'NOT_SUBMITTED'];
    const canRequestPayout = payoutAccount?.kycStatus === 'VERIFIED' && (wallet?.balanceAvailable || 0) > 0;
    const showAccountForm = isEditingAccount || !payoutAccount;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Balance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-green-100 dark:border-green-500/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Available Balance</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(wallet?.balanceAvailable)}</span>
                            <div className="flex items-center mb-1 px-2 py-1 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400 shrink-0">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#F7D483]/30 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F7D483]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Pending (held)</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(wallet?.balancePending)}</span>
                            <div className="flex items-center mb-1 px-2 py-1 bg-[#F7D483]/20 rounded-lg text-[#b59a5a] shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#C9C7F5]/40 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9C7F5]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Total Earned</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(wallet?.totalEarned)}</span>
                            <div className="flex items-center mb-1 px-2 py-1 bg-[#C9C7F5]/20 rounded-lg text-[#5a59b5] shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 dark:bg-gray-800/60 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Total Paid Out</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(wallet?.totalPaidOut)}</span>
                            <div className="flex items-center mb-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 shrink-0">
                                <Landmark className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout account + request payout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Payout Account</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Where your withdrawals are sent</p>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${kyc.className}`}>
                            <kyc.Icon className="w-3.5 h-3.5" />
                            {kyc.label}
                        </span>
                    </div>

                    {payoutAccount?.kycStatus === 'REJECTED' && payoutAccount?.rejectionReason && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            {payoutAccount.rejectionReason}
                        </div>
                    )}

                    {showAccountForm ? (
                        <form onSubmit={handleAccountSubmit} className="space-y-4">
                            <FieldGroup label="Account holder name" required>
                                <input
                                    type="text"
                                    name="accountHolderName"
                                    value={accountForm.accountHolderName}
                                    onChange={handleAccountFieldChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="UPI ID" required description="You'll receive payouts directly to this UPI ID">
                                <input
                                    type="text"
                                    name="upiId"
                                    value={accountForm.upiId}
                                    onChange={handleAccountFieldChange}
                                    placeholder="you@upi"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] outline-none"
                                />
                            </FieldGroup>
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={savingAccount}
                                    className="flex items-center gap-2 bg-[#5a59b5] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#4a49a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingAccount && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {savingAccount ? 'Saving...' : 'Save & submit for verification'}
                                </button>
                                {payoutAccount && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAccount(false)}
                                        className="text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Holder name</span>
                                <span className="font-bold text-gray-800 dark:text-gray-100">{payoutAccount.accountHolderName}</span>
                            </div>
                            {payoutAccount.upiId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">UPI ID</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">{payoutAccount.upiId}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsEditingAccount(true)}
                                className="text-[#5a59b5] text-sm font-bold hover:underline mt-2"
                            >
                                Edit details
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Request a Payout</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        {formatCurrency(wallet?.balanceAvailable)} available to withdraw
                    </p>

                    {payoutAccount?.kycStatus !== 'VERIFIED' && (
                        <div className="mb-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm">
                            Your payout account needs to be verified before you can request a withdrawal.
                        </div>
                    )}

                    <form onSubmit={handlePayoutRequest} className="space-y-4">
                        <FieldGroup label="Amount">
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                max={wallet?.balanceAvailable || 0}
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                disabled={!canRequestPayout}
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] outline-none disabled:opacity-50"
                            />
                        </FieldGroup>
                        <button
                            type="submit"
                            disabled={!canRequestPayout || requestingPayout || !payoutAmount}
                            className="flex items-center gap-2 bg-[#5a59b5] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#4a49a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {requestingPayout && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {requestingPayout ? 'Requesting...' : 'Request Payout'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Payout History */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Payout History</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Withdrawals you've requested</p>
                </div>
                {payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mb-4">
                            <Landmark className="text-gray-300 dark:text-gray-600 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No payouts yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Requested payouts will show up here.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-8 py-4">Amount</th>
                                        <th className="px-6 py-4">Requested</th>
                                        <th className="px-6 py-4">Processed</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {payouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-8 py-4 font-bold text-gray-800 dark:text-gray-100">{formatCurrency(payout.amount)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PAYOUT_STATUS_BADGES[payout.status]}`}>
                                                    {payout.status}
                                                </span>
                                                {payout.status === 'FAILED' && payout.failureReason && (
                                                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{payout.failureReason}</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                            {payouts.map((payout) => (
                                <div key={payout.id} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(payout.amount)}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PAYOUT_STATUS_BADGES[payout.status]}`}>
                                            {payout.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-1 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Requested {new Date(payout.requestedAt).toLocaleDateString()}</span>
                                        <span>{payout.processedAt ? `Processed ${new Date(payout.processedAt).toLocaleDateString()}` : 'Not yet processed'}</span>
                                    </div>
                                    {payout.status === 'FAILED' && payout.failureReason && (
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{payout.failureReason}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Ledger / recent activity */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Activity</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Every credit and debit on your wallet</p>
                </div>
                {ledgerEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="text-gray-300 dark:text-gray-600 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No activity yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Earnings from paid sessions will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {ledgerEntries.map((entry) => {
                            const meta = LEDGER_META[entry.type] || LEDGER_META.REVERSAL;
                            const title = entry.session ? entry.session.title : (entry.description || meta.label);
                            const subtitle = entry.session
                                ? `${meta.label} · ${new Date(entry.createdAt).toLocaleString()}`
                                : new Date(entry.createdAt).toLocaleString();
                            return (
                                <div key={entry.id} className="px-4 sm:px-8 py-4 flex items-center gap-3 sm:gap-4">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.className}`}>
                                        <meta.Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-gray-100 text-sm shrink-0">
                                        {meta.sign}{formatCurrency(entry.amount)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
