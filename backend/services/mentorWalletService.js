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

            await tx.booking.update({
                where: { id: booking.id },
                data: { earningsReleased: true }
            });
        });
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
    return { wallet, ledgerEntries };
};

exports.getPayoutAccount = async (prisma, mentorId) => {
    return prisma.mentorPayoutAccount.findUnique({ where: { mentorId } });
};

exports.upsertPayoutAccount = async (prisma, mentorId, data) => {
    const { accountHolderName, bankAccountNumber, ifscCode, upiId } = data;

    if (!accountHolderName || (!bankAccountNumber && !upiId)) {
        throw new BadRequestError("Provide an account holder name and either bank account details or a UPI ID");
    }
    if (bankAccountNumber && !ifscCode) {
        throw new BadRequestError("IFSC code is required with a bank account number");
    }

    // Resubmitting resets KYC status — a real integration would re-verify via the gateway here.
    return prisma.mentorPayoutAccount.upsert({
        where: { mentorId },
        create: {
            mentorId,
            accountHolderName,
            bankAccountNumber: bankAccountNumber || null,
            ifscCode: ifscCode || null,
            upiId: upiId || null,
            kycStatus: 'PENDING',
            submittedAt: new Date()
        },
        update: {
            accountHolderName,
            bankAccountNumber: bankAccountNumber || null,
            ifscCode: ifscCode || null,
            upiId: upiId || null,
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

        const updatedWallet = await tx.mentorWallet.update({
            where: { id: wallet.id },
            data: { balanceAvailable: { decrement: amount } }
        });

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
    });
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

        return tx.mentorPayout.update({
            where: { id: payoutId },
            data: { status: 'FAILED', failureReason: reason || null, processedAt: new Date() }
        });
    });
};

// Admin-side: marks a payout as paid once the real gateway transfer succeeds.
exports.markPayoutPaid = async (prisma, payoutId, gatewayPayoutId) => {
    const payout = await prisma.mentorPayout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError("Payout not found");
    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
        throw new BadRequestError(`Cannot mark payout in status ${payout.status} as paid`);
    }

    return prisma.$transaction(async (tx) => {
        await tx.mentorWallet.update({
            where: { id: payout.walletId },
            data: { totalPaidOut: { increment: payout.amount } }
        });

        return tx.mentorPayout.update({
            where: { id: payoutId },
            data: { status: 'PAID', gatewayPayoutId: gatewayPayoutId || null, processedAt: new Date() }
        });
    });
};
