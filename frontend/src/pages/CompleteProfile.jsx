import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle,
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StepIndicator } from '../components/profile-setup/FormComponents';
import RoleSelectionStep from '../components/profile-setup/RoleSelectionStep';
import BasicInfoStep from '../components/profile-setup/BasicInfoStep';
import MentorInfoStep from '../components/profile-setup/MentorInfoStep';

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

    const totalSteps = role === 'mentor' ? 3 : role === 'learner' ? 2 : 3;
    const effectiveStep = Math.min(currentStep, totalSteps);

    const handleRoleChange = (value) => {
        setRole(value);
        setStatus(null);
        setCurrentStep((prev) => (value === 'mentor' ? prev : Math.min(prev, 2)));
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setBasicInfo((prev) => ({
            ...prev,
            profilePicture: { file, preview },
        }));
    };

    const handleSelectPredefinedAvatar = (avatarUrl) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setBasicInfo((prev) => ({
            ...prev,
            profilePicture: { avatarUrl, preview: avatarUrl },
        }));
    };

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
                (role === 'learner' || !!basicInfo.profilePicture?.file || !!basicInfo.profilePicture?.avatarUrl) &&
                basicInfo.department.length > 0 &&
                basicInfo.year.length > 0 &&
                basicInfo.bio.length <= 150,
            3: role !== 'mentor' || (mentorInfo.skills.length > 0 && isPhoneValid && isLinkedInValid),
        }),
        [role, basicInfo, mentorInfo, isPhoneValid, isLinkedInValid],
    );

    const goNext = async () => {
        if (role === 'learner' && currentStep === 2) {
            await handleSubmit();
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
        } else if (mentorInfo.phone.trim()) {
            formData.append('phone', mentorInfo.phone.trim());
        }

        return formData;
    };

    const handleSubmit = async () => {
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
                    navigate('/mentor-dashboard');
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

    const primaryCtaLabel =
        role === 'learner'
            ? effectiveStep === 2
                ? 'Submit Profile'
                : 'Next'
            : effectiveStep === 3
                ? 'Submit Profile'
                : 'Next';

    const primaryAction = async () => {
        if (role === 'mentor' && effectiveStep === 3) {
            await handleSubmit();
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
        <div className="min-h-screen bg-[#F4F4F9] relative overflow-hidden flex items-center justify-center py-6">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
            </div>

            <main className="w-full max-w-5xl px-4 relative z-10">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="rounded-[2rem] bg-white shadow-xl shadow-purple-100/50 border border-[#C9C7F5]/30 p-6 md:p-10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C9C7F5]/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />

                    <div className="space-y-2 relative z-10">
                        <p className="text-xs uppercase tracking-wide text-[#5a59b5] font-bold bg-[#C9C7F5]/20 w-fit px-3 py-1 rounded-full">Complete your profile</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Help us personalize ZenovaX for you</h1>
                        <p className="text-gray-500 max-w-2xl text-base">
                            Finish these quick steps so mentors, peers, and coordinators know how best to collaborate with you.
                        </p>
                    </div>

                    <StepIndicator step={effectiveStep} total={totalSteps} />

                    <div className="space-y-6 relative z-10">{renderStep()}</div>

                    {status && (
                        <div
                            className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                }`}
                        >
                            {status.type === 'success' && <CheckCircle className="w-4 h-4" />}
                            {status.message}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-gray-100 relative z-10">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={effectiveStep === 1}
                            className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={primaryAction}
                                disabled={!canProceed || submitting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[#5a59b5] font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${!canProceed || submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#C9C7F5] hover:bg-[#b8b6e5]'
                                    }`}
                            >
                                {primaryCtaLabel}
                                {!submitting && <ArrowRight className="w-4 h-4" />}
                                {submitting && <Check className="w-4 h-4 animate-pulse" />}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


