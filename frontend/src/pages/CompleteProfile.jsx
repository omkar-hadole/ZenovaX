import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, LogOut, Sparkles } from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RoleSelectionStep from '../components/profile-setup/RoleSelectionStep';
import BasicInfoStep from '../components/profile-setup/BasicInfoStep';
import MentorInfoStep from '../components/profile-setup/MentorInfoStep';
import StepComplete from '../components/profile-setup/StepComplete';
import ConfirmModal from '../components/profile-setup/ConfirmModal';
import logoLight from '../assets/logo.svg';
import bgImage from '../assets/bg-image.jpg';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

const STEP_META = {
    1: { label: 'Role', desc: 'Choose your path', q: 'Choose your role', subtitle: 'How will you use ZenovaX?' },
    2: { label: 'Profile', desc: 'Your details', q: 'Complete your profile', subtitle: 'Help the community get to know you' },
    3: { label: 'Expertise', desc: 'Skills & contact', q: 'Share your expertise', subtitle: 'Tell learners what you bring to the table' },
};

export default function CompleteProfile() {
    const navigate = useNavigate();
    const { updateUser, logout, user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [role, setRole] = useState('');
    const [basicInfo, setBasicInfo] = useState({
        profilePicture: null,
        department: '',
        year: '',
        bio: '',
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [mentorInfo, setMentorInfo] = useState({
        skills: [],
        phone: '',
        linkedin: '',
    });
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const statusTimer = useRef(null);

    const totalSteps = role === 'mentor' ? 3 : role === 'learner' ? 2 : 3;
    const effectiveStep = Math.min(currentStep, totalSteps);
    const meta = STEP_META[effectiveStep];

    const steps = useMemo(() => {
        const all = [1, 2, 3];
        return role === 'learner' ? all.slice(0, 2) : all;
    }, [role]);

    useEffect(() => {
        return () => {
            if (previewUrl && !previewUrl.startsWith('http')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (status) {
            const delay = status.type === 'error' ? 4000 : 3000;
            statusTimer.current = setTimeout(() => setStatus(null), delay);
            return () => clearTimeout(statusTimer.current);
        }
    }, [status]);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        try { await logout(); } catch {}
        navigate('/auth');
    };

    const handleBackToZenovaX = () => {
        if (user?.role === 'LEARNER') navigate('/dashboard');
        else if (user?.role === 'MENTOR' || user?.role === 'BOTH') navigate('/mentor/dashboard');
        else if (user?.role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/');
    };

    const handleRoleChange = (value) => {
        setRole(value);
        setStatus(null);
        setCurrentStep((prev) => (value === 'mentor' ? prev : Math.min(prev, 2)));
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (previewUrl && !previewUrl.startsWith('http')) {
            URL.revokeObjectURL(previewUrl);
        }
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setBasicInfo((prev) => ({ ...prev, profilePicture: { file, preview } }));
    };

    const handleSelectPredefinedAvatar = (avatarUrl) => {
        if (previewUrl && !previewUrl.startsWith('http')) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setBasicInfo((prev) => ({ ...prev, profilePicture: { avatarUrl, preview: avatarUrl } }));
    };

    const debouncedBio = useDebounce(basicInfo.bio, 300);
    const debouncedYear = useDebounce(basicInfo.year, 300);
    const debouncedDepartment = useDebounce(basicInfo.department, 300);

    const toggleSkill = (skill) => {
        setMentorInfo((prev) => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter((item) => item !== skill)
                : [...prev.skills, skill],
        }));
    };

    const isPhoneValid = mentorInfo.phone.trim().length >= 10 && /^[0-9+\-\s()]*$/.test(mentorInfo.phone);
    const isLinkedInValid =
        !mentorInfo.linkedin || /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(mentorInfo.linkedin.trim());

    const validations = useMemo(
        () => ({
            1: !!role,
            2:
                !!basicInfo.profilePicture?.preview &&
                debouncedDepartment.length > 0 &&
                debouncedYear.length > 0 &&
                debouncedBio.length <= 150,
            3: role !== 'mentor' || (mentorInfo.skills.length > 0 && isPhoneValid && isLinkedInValid),
        }),
        [role, basicInfo, mentorInfo, isPhoneValid, isLinkedInValid, debouncedYear, debouncedDepartment, debouncedBio],
    );

    const goNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const goPrev = () => {
        setStatus(null);
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const buildFormData = () => {
        const formData = new FormData();
        formData.append('role', role);
        formData.append('department', basicInfo.department);
        formData.append('yearOfStudy', basicInfo.year);
        if (basicInfo.bio) formData.append('bio', basicInfo.bio);
        if (basicInfo.profilePicture?.file) {
            formData.append('profileImage', basicInfo.profilePicture.file);
        } else if (basicInfo.profilePicture?.avatarUrl) {
            formData.append('profilePicture', basicInfo.profilePicture.avatarUrl);
        }
        if (role === 'mentor') {
            formData.append('skills', JSON.stringify(mentorInfo.skills));
            formData.append('phone', mentorInfo.phone.trim());
            if (mentorInfo.linkedin.trim()) formData.append('linkedin', mentorInfo.linkedin.trim());
        }
        return formData;
    };

    const handleSubmit = async () => {
        setShowConfirm(false);
        setSubmitting(true);
        setStatus(null);
        try {
            const formData = buildFormData();
            const response = await apiCall('/profile/complete', {
                method: 'POST',
                body: formData,
            });
            if (response?.user) updateUser(response.user);
            setCompleted(true);
            setTimeout(() => {
                const r = response?.user?.role;
                if (r === 'ADMIN') navigate('/admin/dashboard');
                else if (r === 'MENTOR' || r === 'BOTH') navigate('/mentor/dashboard');
                else navigate('/dashboard');
            }, 2800);
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Unable to save profile' });
        } finally {
            setSubmitting(false);
        }
    };

    const primaryCtaLabel = submitting ? 'Submitting...' :
        effectiveStep === totalSteps ? (role === 'mentor' ? 'Complete setup' : 'Complete setup') : 'Next';

    const primaryAction = () => {
        if (effectiveStep === totalSteps) {
            setShowConfirm(true);
            return;
        }
        goNext();
    };

    const canProceed = validations[effectiveStep];
    const userName = user?.name || 'User';

    const renderStep = () => {
        if (effectiveStep === 1) {
            return <RoleSelectionStep role={role} handleRoleChange={handleRoleChange} />;
        }
        if (effectiveStep === 2) {
            return (
                <BasicInfoStep
                    basicInfo={basicInfo}
                    setBasicInfo={setBasicInfo}
                    handleImageUpload={handleImageUpload}
                    handleSelectPredefinedAvatar={handleSelectPredefinedAvatar}
                    role={role}
                />
            );
        }
        return (
            <MentorInfoStep
                mentorInfo={mentorInfo}
                setMentorInfo={setMentorInfo}
                toggleSkill={toggleSkill}
                isPhoneValid={isPhoneValid}
                isLinkedInValid={isLinkedInValid}
            />
        );
    };

    const pageVariants = {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } },
    };

    const isFirstStep = effectiveStep <= 1;

    return (
        <div className="h-dvh flex flex-col lg:flex-row relative">
            {/* Full-screen background image */}
            <div className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 1,
                }}
            />
            <div className="fixed inset-0 pointer-events-none"
                style={{
                    background: `
                        radial-gradient(
                            ellipse at top left,
                            rgba(8, 20, 40, 0.65) 0%,
                            rgba(8, 20, 40, 0.35) 18%,
                            rgba(8, 20, 40, 0.12) 32%,
                            transparent 48%
                        ),
                        radial-gradient(
                            ellipse at bottom left,
                            rgba(8, 20, 40, 0.65) 0%,
                            rgba(8, 20, 40, 0.35) 18%,
                            rgba(8, 20, 40, 0.12) 32%,
                            transparent 48%
                        )
                    `
                }}
            />

            {/* OVERLAYS */}
            {submitting && !completed && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-surface rounded-2xl shadow-lg p-8 md:p-10 flex flex-col items-center gap-4 max-w-sm mx-4">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold text-text">Setting up your profile</p>
                            <p className="text-sm text-text-muted mt-0.5">Just a moment...</p>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleSubmit}
                icon={Sparkles}
                iconBgClass="bg-amber-50"
                iconColorClass="text-amber-600"
                title="Submit profile?"
                description="You won't be able to change your role after this."
                confirmText="Confirm"
                confirmBtnClass="bg-[#6F66FF] hover:bg-[#5A52E0]"
            />

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                icon={LogOut}
                iconBgClass="bg-red-50"
                iconColorClass="text-red-500"
                title="Leave setup?"
                description="Your progress won't be saved."
                confirmText="Sign Out"
                confirmBtnClass="bg-red-500 hover:bg-red-600"
            />

            {/* ===== LEFT BRAND PANEL ===== */}
            <aside className="hidden lg:flex w-2/5 shrink-0 flex-col relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.04]">
                        <svg viewBox="0 0 400 400" fill="none">
                            <circle cx="300" cy="80" r="160" stroke="white" strokeWidth="1.5" />
                            <circle cx="200" cy="200" r="140" stroke="white" strokeWidth="1" />
                            <circle cx="340" cy="280" r="100" stroke="white" strokeWidth="0.8" />
                        </svg>
                    </div>
                    <div className="absolute bottom-10 left-10 w-px h-28 bg-white/6" />
                </div>

                <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-10">
                    {/* Logo */}
                    <div className="mb-14">
                        <button onClick={() => navigate('/')} className="block cursor-pointer">
                            <img
                                src={logoLight}
                                alt="ZenovaX"
                                className="h-6 object-contain brightness-0 invert"
                            />
                        </button>
                    </div>

                    {/* Step progress with connecting line */}
                    <div className="relative">
                        <div className="absolute left-3 top-3 bottom-3 w-px bg-white/10" />
                        <div className="space-y-0 relative">
                            {steps.map((s, i) => {
                                const m = STEP_META[s];
                                const isActive = s === effectiveStep;
                                const isDone = s < effectiveStep || completed;
                                return (
                                    <div key={s} className="flex items-center gap-4 py-3">
                                        <div className="relative shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold z-10">
                                            {isDone ? (
                                                <Check className="w-3 h-3 text-[#6F66FF]" strokeWidth={3} />
                                            ) : (
                                                <span className={isActive ? 'text-[#6F66FF]' : 'text-white/50'}>
                                                    {s}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm leading-tight transition-all duration-300"
                                                style={{
                                                    color: '#FFFFFF',
                                                    fontWeight: 600,
                                                    textShadow: '0 2px 10px rgba(0,0,0,0.35)'
                                                }}>
                                                {m.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Messaging */}
                    <div className="mt-auto">
                        <p className="text-lg font-bold leading-snug mb-1.5"
                            style={{ color: '#F8FAFC', textShadow: '0 2px 8px rgba(15,23,42,0.55)' }}>
                            {effectiveStep === 1
                                ? 'Start your journey'
                                : effectiveStep === totalSteps
                                    ? 'Almost there'
                                    : 'Tell us about yourself'}
                        </p>
                        <p className="text-sm leading-relaxed"
                            style={{ color: '#F8FAFC', textShadow: '0 2px 8px rgba(15,23,42,0.55)' }}>
                            {effectiveStep === 1
                                ? 'Choose how you want to use ZenovaX.'
                                : effectiveStep === totalSteps
                                    ? 'Just a few final details and you\u2019ll be all set.'
                                    : 'Help others find and connect with you.'}
                        </p>
                        {effectiveStep === 1 && (
                            <div className="flex items-center gap-2 mt-4 text-xs font-medium"
                                style={{ color: '#F8FAFC', textShadow: '0 2px 8px rgba(15,23,42,0.55)' }}>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M7 4V7.5L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Takes less than a minute
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ===== RIGHT CONTENT PANEL ===== */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Navbar */}
                <header className="h-12 shrink-0 flex items-center justify-between px-5 lg:px-10 bg-transparent">
                    <div />



                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        disabled={completed}
                        className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer rounded-lg px-2.5 py-1.5 -mx-2.5 hover:text-red-500 hover:bg-red-50/50"
                        style={{ color: '#1F2F43' }}
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </header>

                {/* Content area — centered form with navigation at bottom */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
                    <div className="relative z-10 flex flex-col flex-1">
                        {!completed && (
                            <div className="flex-1 flex items-center py-6 lg:py-8">
                                <div className="w-full max-w-[520px] mx-auto px-5 lg:px-8">
                                        <div className="mb-6">
                                            <h1 className="text-xl lg:text-2xl font-bold leading-tight tracking-[-0.02em]"
                                            style={{ color: '#163B5C' }}>
                                            {meta?.q}
                                        </h1>
                                        <p className="text-sm mt-1"
                                            style={{ color: '#52738F' }}>
                                            {meta?.subtitle}
                                        </p>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={effectiveStep}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            variants={pageVariants}
                                        >
                                            {renderStep()}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {completed && (
                            <div className="flex-1 flex items-center justify-center py-8">
                                <div className="w-full max-w-[520px] mx-auto px-5 lg:px-8">
                                    <StepComplete userName={userName} />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        {!completed && (
                            <div className="shrink-0 px-5 lg:px-8">
                                <div className="max-w-[520px] mx-auto flex items-center justify-between gap-4 py-5">
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        disabled={isFirstStep}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-200 ${
                                            isFirstStep
                                                ? 'opacity-0 pointer-events-none'
                                                : 'bg-[rgba(255,255,255,0.48)] border-[rgba(74,130,175,0.22)] backdrop-blur-[10px] hover:bg-[rgba(255,255,255,0.72)] hover:border-[rgba(59,157,232,0.38)] hover:text-[#1F6FAE] active:bg-[rgba(225,240,250,0.72)] active:scale-[0.985] text-[#315D7D] cursor-pointer'
                                        }`}
                                        style={{
                                            border: '1px solid rgba(74,130,175,0.22)',
                                            transition: 'all 0.22s ease',
                                        }}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        onClick={primaryAction}
                                        disabled={!canProceed || submitting}
                                        className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 ${
                                            !canProceed || submitting
                                                ? 'cursor-not-allowed'
                                                : 'text-white cursor-pointer'
                                        }`}
                                        style={!canProceed || submitting ? {
                                            background: 'rgba(255,255,255,0.48)',
                                            border: '1px solid rgba(74,130,175,0.22)',
                                            color: '#315D7D',
                                            backdropFilter: 'blur(10px)',
                                            opacity: 0.6,
                                        } : canProceed && !submitting ? {
                                            background: '#7674E9',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.30)',
                                            boxShadow: '0 8px 22px rgba(118,116,233,0.28)',
                                            transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
                                            transform: 'translateY(0)',
                                        } : {}}
                                        onMouseEnter={(e) => {
                                            if (canProceed && !submitting) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.filter = 'brightness(1.04)';
                                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(118,116,233,0.36)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (canProceed && !submitting) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.filter = 'none';
                                                e.currentTarget.style.boxShadow = '0 8px 22px rgba(118,116,233,0.28)';
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            if (canProceed && !submitting) {
                                                e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(118,116,233,0.24)';
                                            }
                                        }}
                                        onMouseUp={(e) => {
                                            if (canProceed && !submitting) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.filter = 'brightness(1.04)';
                                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(118,116,233,0.36)';
                                            }
                                        }}
                                    >
                                        <span>{primaryCtaLabel}</span>
                                        {!submitting && primaryCtaLabel !== 'Submitting...' && (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status messages */}
                        {status && (
                            <div className="shrink-0 px-5 lg:px-8 pb-5">
                                <div className="max-w-[520px] mx-auto">
                                    <div
                                        className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                                            status.type === 'success'
                                                ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                        }`}
                                    >
                                        {status.type === 'success' ? (
                                            <Check className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setStatus(null)} />
                                        )}
                                        <span className="flex-1">{status.message}</span>
                                        {status.type === 'error' && (
                                            <button onClick={() => setStatus(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
