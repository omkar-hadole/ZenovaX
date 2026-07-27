import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle,
    Loader2,
    AlertTriangle,
    X,
    User,
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StepIndicator } from '../components/profile-setup/FormComponents';
import RoleSelectionStep from '../components/profile-setup/RoleSelectionStep';
import BasicInfoStep from '../components/profile-setup/BasicInfoStep';
import MentorInfoStep from '../components/profile-setup/MentorInfoStep';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export default function CompleteProfile() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
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
    const [showConfirm, setShowConfirm] = useState(false);
    const statusTimer = useRef(null);

    const totalSteps = role === 'mentor' ? 3 : role === 'learner' ? 2 : 3;
    const effectiveStep = Math.min(currentStep, totalSteps);

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
        setBasicInfo((prev) => ({
            ...prev,
            profilePicture: { file, preview },
        }));
    };

    const handleSelectPredefinedAvatar = (avatarUrl) => {
        if (previewUrl && !previewUrl.startsWith('http')) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setBasicInfo((prev) => ({
            ...prev,
            profilePicture: { avatarUrl, preview: avatarUrl },
        }));
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

    const goNext = async () => {
        if (role === 'learner' && currentStep === 2) {
            setShowConfirm(true);
            return;
        }
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

        if (basicInfo.bio) {
            formData.append('bio', basicInfo.bio);
        }

        if (basicInfo.profilePicture?.file) {
            formData.append('profileImage', basicInfo.profilePicture.file);
        } else if (basicInfo.profilePicture?.avatarUrl) {
            formData.append('profilePicture', basicInfo.profilePicture.avatarUrl);
        }

        if (role === 'mentor') {
            formData.append('skills', JSON.stringify(mentorInfo.skills));
            formData.append('phone', mentorInfo.phone.trim());
            if (mentorInfo.linkedin.trim()) {
                formData.append('linkedin', mentorInfo.linkedin.trim());
            }
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

            if (response?.user) {
                updateUser(response.user);
            }

            setStatus({ type: 'success', message: 'Profile completed! Redirecting to dashboard...' });
            setTimeout(() => {
                const role = response?.user?.role;
                if (role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (role === 'MENTOR' || role === 'BOTH') {
                    navigate('/mentor/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1200);
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Unable to save profile' });
        } finally {
            setSubmitting(false);
        }
    };

    const primaryCtaLabel = submitting ? 'Submitting...' :
        role === 'learner'
            ? effectiveStep === 2
                ? 'Submit Profile'
                : 'Next'
            : effectiveStep === 3
                ? 'Submit Profile'
                : 'Next';

    const primaryAction = async () => {
        if (role === 'mentor' && effectiveStep === 3) {
            setShowConfirm(true);
            return;
        }
        await goNext();
    };

    const canProceed = validations[effectiveStep];

    const renderStep = () => {
        if (effectiveStep === 1) {
            return (
                <RoleSelectionStep role={role} handleRoleChange={handleRoleChange} />
            );
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

    return (
        <div className="min-h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden flex items-center justify-center py-6">
            {submitting && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center gap-5 max-w-sm mx-4">
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                            <Check className="w-7 h-7 text-green-600 dark:text-green-400 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Setting up your profile</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we save your information...</p>
                        </div>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm mx-4 w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Submit profile?</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">You won't be able to change your role after this.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#5a59b5] text-white font-bold hover:bg-[#4a49a5] transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
            </div>

            <main className="w-full max-w-5xl px-4 relative z-10">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="rounded-[2rem] bg-white dark:bg-gray-900 shadow-xl shadow-purple-100/50 dark:shadow-none border border-[#C9C7F5]/30 dark:border-gray-800 p-6 md:p-10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C9C7F5]/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />

                    <div className="space-y-2 relative z-10">
                        <p className="text-xs uppercase tracking-wide text-[#5a59b5] dark:text-[#b3b1f0] font-bold bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 w-fit px-3 py-1 rounded-full">Complete your profile</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Help us personalize ZenovaX for you</h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-base">
                            Finish these quick steps so mentors, peers, and coordinators know how best to collaborate with you.
                        </p>
                    </div>

                    <StepIndicator step={effectiveStep} total={totalSteps} />

                    <div className="space-y-6 relative z-10">{renderStep()}</div>

                    {status && (
                        <div
                            className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${status.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                    : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                }`}
                        >
                            {status.type === 'success' ? (
                                <CheckCircle className="w-4 h-4 shrink-0" />
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
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 relative z-10">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={effectiveStep === 1}
                            className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-2.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={primaryAction}
                            disabled={!canProceed || submitting}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full md:w-auto ${!canProceed || submitting
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none hover:shadow-none hover:-translate-y-0'
                                    : 'bg-[#C9C7F5] text-[#5a59b5] hover:bg-[#b8b6e5]'
                                }`}
                        >
                            {primaryCtaLabel}
                            {!submitting && primaryCtaLabel !== 'Submitting...' && <ArrowRight className="w-4 h-4" />}
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
