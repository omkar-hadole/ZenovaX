# Payment & Mentor Payout Flow

How money moves through ZenovaX for paid sessions: student → platform → mentor.

## Money flow (implemented)

1. **Student books a paid session.** `POST /api/sessions/book/:id`
   - **Razorpay configured** → a PENDING booking reserves the seat, a Razorpay order is created, and the response is `{ requiresPayment, order, keyId, bookingId }`. The learner UI opens Razorpay Checkout.
   - **Razorpay NOT configured** (dev default) → the charge is *simulated*: the booking is confirmed instantly and the mentor's wallet is credited. No real money moves. This keeps the app fully usable without gateway keys.
2. **Student completes checkout** → `POST /api/sessions/verify-payment` verifies the Razorpay signature, confirms the booking, marks the transaction SUCCESS, and credits the mentor's **pending** wallet balance. The **webhook** (`POST /api/payments/webhook`, `payment.captured` / `order.paid`) is the reliable backstop and is idempotent with the client callback.
3. **Fee split.** Platform keeps `PLATFORM_FEE_PERCENT` (default 15%); the remainder is the mentor's share. Computed in `paymentService.computeFeeSplit`.
4. **Session completes** (queue worker) → the mentor's earnings move from **pending** → **available**.
5. **Mentor requests a payout** (`/mentor/earnings`) against available balance — requires a **VERIFIED** payout account. This reserves the funds and records a PENDING payout.
6. **Admin releases the payout** (`/admin/payments`) → after transferring the money (manually via netbanking/UPI for now, or via RazorpayX Payouts once approved), marks it **PAID**. Marking **FAILED** returns the funds to the mentor's balance.
7. **Abandoned checkouts**: PENDING bookings past `BOOKING_HOLD_MINUTES` are auto-cancelled and their seats released by the queue worker.

## Data model (`backend/prisma/schema.prisma`)

- `Booking` / `Transaction` — the student-side charge, gateway ids, fee split.
- `MentorWallet` — `balancePending`, `balanceAvailable`, `totalEarned`, `totalPaidOut`.
- `MentorLedgerEntry` — every credit/debit (BOOKING_CREDIT, RELEASE, PAYOUT, REVERSAL).
- `MentorPayout` — withdrawal requests and their status.
- `MentorPayoutAccount` — bank/UPI details + `kycStatus` (NOT_SUBMITTED/PENDING/VERIFIED/REJECTED).

## Key files

- `backend/services/paymentService.js` — Razorpay order creation, signature/webhook verification, fee split, refund (all via REST + HMAC, no SDK dependency).
- `backend/services/mentorWalletService.js` — wallet ledger, payout requests, admin verify/reject/mark-paid.
- `backend/services/sessionService.js` — booking, `verifyPayment`, `confirmBookingPaid`, `cancelPendingBooking`.
- `backend/controllers/paymentController.js` + `routes/payments.js` — `/config`, webhook.
- `frontend/src/pages/mentor/MentorEarningsPage.jsx` — mentor earnings & payout UI.
- `frontend/src/pages/admin/AdminPayments.jsx` — admin KYC + payout release UI.
- `frontend/src/utils/razorpay.js` — Checkout script loader.

## Configuration

See `backend/.env.example`. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to go live; leave blank for the simulated dev flow. `PLATFORM_FEE_PERCENT` sets the commission.

## What still requires external setup (not code)

- **Real card/UPI charges** need a Razorpay account + API keys in the backend env.
- **Automated bank/UPI payouts to mentors** need RazorpayX **Route/Payouts** approval (Razorpay's business KYC). Until then, admin marks payouts PAID after transferring manually — the data model and UI are already built for the automated version, so swapping it in later requires no schema change.

## Security notes

- Raw card/UPI/bank numbers are never handled by our servers for charges — Razorpay Checkout collects them (keeps us out of PCI-DSS scope). The bank fields on `MentorPayoutAccount` are a dev placeholder; in production replace with a tokenized gateway fund-account reference.
- Webhook signatures are HMAC-verified against the raw request body before any state change.
- Payment-verification signatures are HMAC-verified; a bad signature marks the transaction FAILED.
- Payouts require mentor KYC (`VERIFIED`) first.
