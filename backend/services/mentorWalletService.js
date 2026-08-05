const { BadRequestError, NotFoundError } = require("../utils/errors");

async function getOrCreateWallet(client, mentorId) {
    let wallet = await client.mentorWallet.findUnique({ where: { mentorId } });
    if (!wallet) {
        wallet = await client.mentorWallet.create({ data: { mentorId } });
    }
    return wallet;
}
exports.getOrCreateWallet = getOrCreateWallet;

// Called inside the booking transaction once a paid booking's (simulated) payment
// succeeds. Credits the mentor's pending balance — held until the session completes.
exports.recordBookingEarning = async (tx, mentorId, booking) => {
    const mentorShare = booking.amountPaid - booking.platformFee;
    if (mentorShare <= 0) return null;

    const wallet = await getOrCreateWallet(tx, mentorId);

    const updatedWallet = await tx.mentorWallet.update({
        where: { id: wallet.id },
        data: {
            balancePending: { increment: mentorShare },
            totalEarned: { increment: mentorShare }
        }
    });

    await tx.mentorLedgerEntry.create({
        data: {
            walletId: wallet.id,
            type: 'BOOKING_CREDIT',
            amount: mentorShare,
            bookingId: booking.id,
            description: `Earning held for booking ${booking.id}`
        }
    });

    return updatedWallet;
};

// Called when a session transitions to COMPLETED — releases the hold on earnings
// for every paid booking on that session that hasn't been released yet.
exports.releaseEarningsForSession = async (prisma, sessionId) => {
    const bookings = await prisma.booking.findMany({
        where: {
            sessionId,
            amountPaid: { gt: 0 },
            earningsReleased: false,
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        include: { session: { select: { mentorId: true } } }
    });

    let releasedCount = 0;
    for (const booking of bookings) {
        const mentorShare = booking.amountPaid - booking.platformFee;
        if (mentorShare <= 0) continue;

        await prisma.$transaction(async (tx) => {
            // Atomic claim on the booking itself: only the worker pass that flips
            // earningsReleased false -> true may move the money. A second concurrent
            // pass (e.g. an overlapping scheduled Lambda) sees count === 0 and skips,
            // so earnings are never released twice.
            const claimed = await tx.booking.updateMany({
                where: { id: booking.id, earningsReleased: false },
                data: { earningsReleased: true }
            });
            if (claimed.count === 0) return;

            const wallet = await getOrCreateWallet(tx, booking.session.mentorId);

            await tx.mentorWallet.update({
                where: { id: wallet.id },
                data: {
                    balancePending: { decrement: mentorShare },
                    balanceAvailable: { increment: mentorShare }
                }
            });

            await tx.mentorLedgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: 'RELEASE',
                    amount: mentorShare,
                    bookingId: booking.id,
                    description: `Earnings released for completed booking ${booking.id}`
                }
            });
        }, { timeout: 15000 });
        releasedCount++;
    }

    return releasedCount;
};

exports.getWalletSummary = async (prisma, mentorId) => {
    const wallet = await getOrCreateWallet(prisma, mentorId);
    const ledgerEntries = await prisma.mentorLedgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    // bookingId is a plain reference (not a Prisma relation on MentorLedgerEntry), so
    // resolve booking -> session in one batched query rather than per-entry lookups.
    const bookingIds = [...new Set(ledgerEntries.map(e => e.bookingId).filter(Boolean))];
    const bookings = bookingIds.length
        ? await prisma.booking.findMany({
            where: { id: { in: bookingIds } },
            select: { id: true, session: { select: { id: true, title: true, subject: true, scheduledAt: true } } }
        })
        : [];
    const sessionByBooking = new Map(bookings.map(b => [b.id, b.session]));

    const enrichedEntries = ledgerEntries.map(entry => ({
        ...entry,
        session: entry.bookingId ? (sessionByBooking.get(entry.bookingId) || null) : null
    }));

    return { wallet, ledgerEntries: enrichedEntries };
};

exports.getPayoutAccount = async (prisma, mentorId) => {
    return prisma.mentorPayoutAccount.findUnique({ where: { mentorId } });
};

exports.upsertPayoutAccount = async (prisma, mentorId, data) => {
    const { accountHolderName, upiId } = data;

    if (!accountHolderName || !upiId) {
        throw new BadRequestError("Provide an account holder name and a UPI ID");
    }

    // Resubmitting resets KYC status — a real integration would re-verify via the gateway here.
    return prisma.mentorPayoutAccount.upsert({
        where: { mentorId },
        create: {
            mentorId,
            accountHolderName,
            upiId,
            kycStatus: 'PENDING',
            submittedAt: new Date()
        },
        update: {
            accountHolderName,
            upiId,
            kycStatus: 'PENDING',
            submittedAt: new Date(),
            verifiedAt: null,
            rejectionReason: null
        }
    });
};

// Mentor-initiated withdrawal request. No real money moves yet — this reserves the
// funds and records intent; markPayoutPaid/markPayoutFailed finalize it once a real
// gateway payout integration exists.
exports.requestPayout = async (prisma, mentorId, amount) => {
    if (!amount || amount <= 0) {
        throw new BadRequestError("Payout amount must be greater than zero");
    }

    const payoutAccount = await prisma.mentorPayoutAccount.findUnique({ where: { mentorId } });
    if (!payoutAccount || payoutAccount.kycStatus !== 'VERIFIED') {
        throw new BadRequestError("A verified payout account is required before requesting a payout");
    }

    return prisma.$transaction(async (tx) => {
        const wallet = await getOrCreateWallet(tx, mentorId);
        if (amount > wallet.balanceAvailable) {
            throw new BadRequestError("Requested amount exceeds available balance");
        }

        // Atomic guard against concurrent payout requests overdrawing the wallet:
        // the decrement only applies when enough balance is still available, so two
        // simultaneous requests can never both succeed past the funds.
        const claimed = await tx.mentorWallet.updateMany({
            where: { id: wallet.id, balanceAvailable: { gte: amount } },
            data: { balanceAvailable: { decrement: amount } }
        });
        if (claimed.count === 0) {
            throw new BadRequestError("Requested amount exceeds available balance");
        }

        const updatedWallet = await tx.mentorWallet.findUnique({ where: { id: wallet.id } });

        const payout = await tx.mentorPayout.create({
            data: {
                walletId: wallet.id,
                mentorId,
                amount,
                status: 'PENDING'
            }
        });

        await tx.mentorLedgerEntry.create({
            data: {
                walletId: wallet.id,
                type: 'PAYOUT',
                amount,
                payoutId: payout.id,
                description: `Payout requested (${payout.id})`
            }
        });

        return { payout, wallet: updatedWallet };
    }, { timeout: 15000 });
};

exports.getPayoutHistory = async (prisma, mentorId) => {
    return prisma.mentorPayout.findMany({
        where: { mentorId },
        orderBy: { requestedAt: 'desc' }
    });
};

// Admin-side: marks a payout as failed and refunds the reserved amount back to the
// mentor's available balance. Call once a real gateway integration reports failure.
exports.markPayoutFailed = async (prisma, payoutId, reason) => {
    const payout = await prisma.mentorPayout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError("Payout not found");
    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
        throw new BadRequestError(`Cannot fail a payout in status ${payout.status}`);
    }

    return prisma.$transaction(async (tx) => {
        // Atomic claim on the payout's status so concurrent admin calls can't
        // double-refund a failed payout.
        const claimed = await tx.mentorPayout.updateMany({
            where: { id: payoutId, status: { in: ['PENDING', 'PROCESSING'] } },
            data: { status: 'FAILED', failureReason: reason || null, processedAt: new Date() }
        });
        if (claimed.count === 0) {
            throw new BadRequestError(`Cannot fail a payout in status ${payout.status}`);
        }

        await tx.mentorWallet.update({
            where: { id: payout.walletId },
            data: { balanceAvailable: { increment: payout.amount } }
        });

        await tx.mentorLedgerEntry.create({
            data: {
                walletId: payout.walletId,
                type: 'REVERSAL',
                amount: payout.amount,
                payoutId: payout.id,
                description: `Payout ${payout.id} failed: ${reason || 'unspecified'}`
            }
        });

        return tx.mentorPayout.findUnique({ where: { id: payoutId } });
    }, { timeout: 15000 });
};

// Admin-side: marks a payout as paid once the real gateway transfer succeeds.
exports.markPayoutPaid = async (prisma, payoutId, gatewayPayoutId) => {
    const payout = await prisma.mentorPayout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError("Payout not found");
    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
        throw new BadRequestError(`Cannot mark payout in status ${payout.status} as paid`);
    }

    return prisma.$transaction(async (tx) => {
        // Atomic claim on the payout's status so concurrent admin calls can't
        // double-count the payout in totalPaidOut.
        const claimed = await tx.mentorPayout.updateMany({
            where: { id: payoutId, status: { in: ['PENDING', 'PROCESSING'] } },
            data: { status: 'PAID', gatewayPayoutId: gatewayPayoutId || null, processedAt: new Date() }
        });
        if (claimed.count === 0) {
            throw new BadRequestError(`Cannot mark payout in status ${payout.status} as paid`);
        }

        await tx.mentorWallet.update({
            where: { id: payout.walletId },
            data: { totalPaidOut: { increment: payout.amount } }
        });

        return tx.mentorPayout.findUnique({ where: { id: payoutId } });
    }, { timeout: 15000 });
};

// ---- Admin-facing operations ----

// Approve a mentor's payout account after reviewing their KYC/bank details.
exports.verifyPayoutAccount = async (prisma, accountId) => {
    const account = await prisma.mentorPayoutAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundError("Payout account not found");
    return prisma.mentorPayoutAccount.update({
        where: { id: accountId },
        data: { kycStatus: 'VERIFIED', verifiedAt: new Date(), rejectionReason: null }
    });
};

// Reject a mentor's payout account with a reason.
exports.rejectPayoutAccount = async (prisma, accountId, reason) => {
    const account = await prisma.mentorPayoutAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundError("Payout account not found");
    return prisma.mentorPayoutAccount.update({
        where: { id: accountId },
        data: { kycStatus: 'REJECTED', rejectionReason: reason || 'Details could not be verified', verifiedAt: null }
    });
};

// List payout accounts for the admin KYC queue. Optionally filter by kycStatus.
exports.listPayoutAccounts = async (prisma, status) => {
    return prisma.mentorPayoutAccount.findMany({
        where: status ? { kycStatus: status } : undefined,
        orderBy: [{ kycStatus: 'asc' }, { submittedAt: 'desc' }],
        include: { mentor: { select: { id: true, name: true, email: true } } }
    });
};

// List payout requests for the admin payouts queue. Optionally filter by status.
exports.listAllPayouts = async (prisma, status) => {
    return prisma.mentorPayout.findMany({
        where: status ? { status } : undefined,
        orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
        include: {
            mentor: { select: { id: true, name: true, email: true } }
        }
    });
};

// Headline numbers for the admin Payments dashboard.
exports.getPaymentsOverview = async (prisma) => {
    const [revenueAgg, walletAgg, pendingKyc, pendingPayoutsAgg, txnCount] = await Promise.all([
        prisma.transaction.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { platformFee: true, totalAmount: true }
        }),
        prisma.mentorWallet.aggregate({
            _sum: { balancePending: true, balanceAvailable: true, totalEarned: true, totalPaidOut: true }
        }),
        prisma.mentorPayoutAccount.count({ where: { kycStatus: 'PENDING' } }),
        prisma.mentorPayout.aggregate({
            where: { status: { in: ['PENDING', 'PROCESSING'] } },
            _sum: { amount: true },
            _count: true
        }),
        prisma.transaction.count({ where: { status: 'SUCCESS' } })
    ]);

    return {
        platformRevenue: revenueAgg._sum.platformFee || 0,
        grossProcessed: revenueAgg._sum.totalAmount || 0,
        successfulTransactions: txnCount,
        mentorPendingBalance: walletAgg._sum.balancePending || 0,
        mentorAvailableBalance: walletAgg._sum.balanceAvailable || 0,
        mentorTotalEarned: walletAgg._sum.totalEarned || 0,
        mentorTotalPaidOut: walletAgg._sum.totalPaidOut || 0,
        pendingKycCount: pendingKyc,
        pendingPayoutsCount: pendingPayoutsAgg._count || 0,
        pendingPayoutsAmount: pendingPayoutsAgg._sum.amount || 0
    };
};

// Top-earning mentors, ranked by lifetime earnings (before payout). Used by the
// admin Payments dashboard leaderboard.
exports.getMentorEarningsLeaderboard = async (prisma, limit = 10) => {
    const wallets = await prisma.mentorWallet.findMany({
        where: { totalEarned: { gt: 0 } },
        orderBy: { totalEarned: 'desc' },
        take: limit,
        include: {
            mentor: {
                select: { id: true, name: true, email: true, profilePicture: true, totalSessions: true, averageRating: true }
            }
        }
    });

    return wallets.map(w => ({
        mentor: w.mentor,
        totalEarned: w.totalEarned,
        balanceAvailable: w.balanceAvailable,
        balancePending: w.balancePending,
        totalPaidOut: w.totalPaidOut
    }));
};
