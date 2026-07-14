# Payment & Mentor Payout Flow

How money should move through ZenovaX for paid sessions: student → platform → mentor.

## Current state (as of this doc)

The schema (`backend/prisma/schema.prisma`) already has the bookkeeping shape ready:

- `Session.price`, `Session.platformFee` — per-session pricing set by the mentor/admin.
- `Booking.amountPaid`, `Booking.platformFee`, `Booking.totalAmount`, `Booking.paymentId` — per-booking payment record.
- `Transaction` model — `gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature`, `TransactionStatus` (`PENDING`/`SUCCESS`/`FAILED`/`REFUNDED`), `PaymentMethod` (`RAZORPAY`/`PHONEPE`/`UPI`/`CARD`/`NETBANKING`).

None of this is wired to a real payment gateway yet — `executeBookingTransaction` in `backend/services/sessionService.js` currently sets `amountPaid: 0` unconditionally. There is also no mentor wallet, payout, or KYC/bank-details model yet.

## Target flow

### 1. Student pays into the platform's account (not the mentor directly)

- Backend creates an "order" with the gateway (Razorpay fits best given the existing `PaymentMethod` enum).
- Frontend opens the gateway's hosted checkout / SDK — card, UPI, netbanking details are entered there, never on our servers. Keeps us out of PCI-DSS scope.
- Gateway redirects/webhooks back with a signed payment confirmation.
- Backend verifies the signature (`gatewaySignature`) and flips the `Transaction` to `SUCCESS`; on failure, `FAILED`.

### 2. Split the money in the ledger (bookkeeping, not a real transfer yet)

- `mentorShare = Session.price - Session.platformFee`
- Credit `mentorShare` to a new **mentor earnings ledger** (not built yet — see below). This is just a DB row; no money has moved out of the platform's account at this point.

### 3. Mentor money section (dashboard)

A mentor-facing view built on top of the ledger, showing:
- Total lifetime earnings
- Available balance (sessions completed, past any hold period)
- Pending balance (booked but session not yet completed/confirmed)
- Payout history (past transfers, status, date)

### 4. Real payout to the mentor's bank/UPI

This is the only step that actually moves money out of the platform account:
- Mentor must complete KYC and link a bank account/UPI with the gateway first (e.g. Razorpay Linked Account for Route, or RazorpayX Contact+Fund Account for Payouts).
- Two options:
  - **Razorpay Route** — auto-splits each transaction between platform and mentor at payment time.
  - **RazorpayX Payouts** — platform holds all funds, then pushes payouts on a schedule or when a mentor requests a withdrawal.
- Either way, this should be a server-initiated, admin-auditable action — never a client-triggered fund transfer.

### 5. Refunds

- Issued through the gateway's refund API against the original `gatewayPaymentId`.
- `Transaction.status` → `REFUNDED`; if the mentor had already been paid out for that booking, the refund needs to be reconciled against their ledger (deduct from future payouts, or treat as a clawback).

## What needs to be built (not present today)

| Piece | Purpose |
|---|---|
| Gateway integration (order create + webhook verify) | Actually accept payment from students |
| `MentorWallet` / `MentorEarnings` table | Track balance owed to each mentor |
| `Payout` table | Record of actual transfers to mentors (amount, status, gateway payout id) |
| Mentor KYC / bank-detail fields | Required by the gateway before payouts can be sent |
| Admin/cron trigger for payouts | Decide when payouts actually get released |

## Security notes

- Never store raw card numbers, CVVs, or full bank account numbers — the gateway's SDK/checkout handles those.
- Always verify webhook signatures server-side before trusting a "payment succeeded" event.
- Payouts should require mentor KYC completion first; gateways enforce this for compliance (RBI/PMLA in India).
