import React from 'react';
import HelpCenter from '../../components/help/HelpCenter';

const MENTOR_FAQS = [
    {
        q: 'How do I create and publish a session?',
        a: 'Go to My Sessions in the sidebar and click Create Session. Fill in the topic, schedule, capacity, and price, then submit. An admin reviews and approves it before it goes live to learners.',
    },
    {
        q: 'When and how do I get paid for paid sessions?',
        a: 'Earnings from paid sessions are tracked in the Earnings section. Payout details are processed to the account you provided on approval — reach out to support if you need to update them.',
    },
    {
        q: 'How do I scan attendance?',
        a: 'Open Scan Attendance from the sidebar, select the session, and scan each learner\'s QR code as they arrive. Attendance is recorded and saved automatically.',
    },
    {
        q: 'How do I handle a no-show or cancellation?',
        a: 'Learners can cancel up until the session starts. You can cancel from your session details if needed; for paid sessions this triggers an automatic refund for the learner.',
    },
    {
        q: 'Why are sessions I created still pending?',
        a: 'New sessions go through admin review for quality and consistency. This usually takes less than 24 hours — ping us on WhatsApp if yours has been waiting longer.',
    },
    {
        q: 'How do I update my profile or account settings?',
        a: 'Head to Settings in the sidebar to update your password, manage your profile, and control your account preferences.',
    },
];

const MENTOR_TIPS = [
    <>Use the <strong className="text-white">Zen</strong> assistant for instant help with tips and guidance.</>,
    'Keep your session details updated so learners always see accurate info.',
    'Check the FAQs below before reaching out — most answers are already there.',
];

const MentorHelpCenter = () => (
    <HelpCenter
        subtitle="Mentor support — session, payments, and everything in between."
        whatsappText="Dedicated support for mentors — we're online and ready to help you directly."
        faqs={MENTOR_FAQS}
        tips={MENTOR_TIPS}
    />
);

export default MentorHelpCenter;