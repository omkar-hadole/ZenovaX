import React from 'react';
import HelpCenter from '../../components/help/HelpCenter';

const LEARNER_FAQS = [
    {
        q: 'How do I book a session?',
        a: 'Go to Browse Sessions, pick one that fits your schedule, and click Register. Free sessions confirm instantly; paid sessions confirm right after payment goes through.',
    },
    {
        q: 'Can I cancel or reschedule a booking?',
        a: "You can cancel from My Bookings up until the session starts. Rescheduling isn't automatic — reach out to your mentor or support and we'll help sort it out.",
    },
    {
        q: "I registered but the meeting link isn't working. What do I do?",
        a: 'The "Join Live Class" button only activates 15 minutes before the session starts — that\'s expected. If it still doesn\'t work once live, refresh the page first, then message us on WhatsApp for a fast fix.',
    },
    {
        q: 'How do refunds work for paid sessions?',
        a: "If a mentor cancels a paid session, you're refunded automatically. For other refund requests, email support@zenovax.com with your booking details and we'll review it within 24–48 hours.",
    },
    {
        q: 'How do I become a mentor on ZenovaX?',
        a: 'Complete your profile and submit a session request from the mentor dashboard. An admin reviews and approves it before it goes live to learners.',
    },
    {
        q: 'How do I change my password or account settings?',
        a: "Head to Settings from the sidebar — you can update your password, control your profile's phone number visibility, and manage your account from there.",
    },
];

const LEARNER_TIPS = [
    <>For instant AI assistance, try asking <strong className="text-white">Zen</strong> in the sidebar — it's faster!</>,
    'Use WhatsApp for urgent issues that need human intervention.',
    'Check the FAQs below before reaching out — most answers are already there.',
];

const HelpCenterPage = () => (
    <HelpCenter
        subtitle="Get instant answers or connect with our team — we're just a tap away."
        whatsappText="Get instant help from our team — we're online and ready to assist you directly."
        faqs={LEARNER_FAQS}
        tips={LEARNER_TIPS}
    />
);

export default HelpCenterPage;