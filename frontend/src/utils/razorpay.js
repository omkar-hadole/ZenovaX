// Loads the Razorpay Checkout script once and caches the promise.
let scriptPromise = null;

function loadRazorpayScript() {
    if (window.Razorpay) return Promise.resolve(true);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load payment gateway'));
        };
        document.body.appendChild(script);
    });
    return scriptPromise;
}

// Opens Razorpay Checkout for a created order and resolves with the payment
// response ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) on
// success, or rejects if the user dismisses the modal.
export async function openRazorpayCheckout({ keyId, order, prefill, name, description }) {
    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: keyId,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: name || 'ZenovaX',
            description: description || 'Session booking',
            order_id: order.id,
            prefill: prefill || {},
            theme: { color: '#5a59b5' },
            handler: (response) => resolve(response),
            modal: {
                ondismiss: () => reject(new Error('Payment cancelled')),
            },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'Payment failed')));
        rzp.open();
    });
}
