import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { apiCall } from '../../../utils/api';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Sidebar earnings teaser, shown in place of the old static upgrade promo.
 * Shows the mentor's available balance and links into the full Earnings page.
 */
export default function EarningsTeaserCard() {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);

    useEffect(() => {
        let cancelled = false;
        apiCall('/wallet/me')
            .then(({ wallet: summary }) => {
                if (!cancelled) setWallet(summary);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="bg-gradient-to-br from-[#C9C7F5] to-[#A9C1F7] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-bl-full" />
            <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-3">
                    <Wallet className="w-4 h-4 text-gray-800" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-gray-700">Available balance</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1 mb-4">
                    {wallet ? formatCurrency(wallet.balanceAvailable) : '···'}
                </p>
                <button
                    onClick={() => navigate('/mentor/earnings')}
                    className="flex items-center justify-center gap-1.5 bg-white text-[#5a59b5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors w-full shadow-sm"
                >
                    View Earnings
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
