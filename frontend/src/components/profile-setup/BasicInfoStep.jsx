import { UploadCloud } from 'lucide-react';
import { FieldGroup } from './FormComponents';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

const departmentOptions = ['AI/ML', 'AI/DS', 'BBA', 'Design', 'Psychology'];
const yearOptions = ['1', '2', '3', '4'];

const PREDEFINED_AVATARS = [
    '/avatars/Boy_1.png',
    '/avatars/Boy_2.png',
    '/avatars/Boy_3.png',
    '/avatars/Girl_1.png',
    '/avatars/Girl_2.png',
    '/avatars/Girl_3.png',
];

function Select({ value, onChange, options, placeholder }) {
    const hasValue = value !== '';
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6F66FF]/20 focus:border-[#6F66FF] bg-white/60 backdrop-blur-md ${
                    hasValue ? 'text-text border-white/30' : 'text-text-subtle border-white/20'
                }`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                    </option>
                ))}
            </select>
            <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none"
                viewBox="0 0 16 16" fill="none"
            >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

export default function BasicInfoStep({ basicInfo, setBasicInfo, handleImageUpload, handleSelectPredefinedAvatar, role }) {
    const preview = basicInfo.profilePicture?.preview;

    return (
        <div className="space-y-6">
            {/* Profile Photo — Integrated Upload + Avatar */}
            <div className="flex items-start gap-5">
                <label
                    htmlFor="profile-picture-input"
                    className="relative block w-20 h-20 rounded-xl overflow-hidden cursor-pointer group shrink-0"
                >
                    <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-200 ${
                        preview
                            ? 'ring-2 ring-[#6F66FF] ring-offset-2 ring-offset-bg'
                            : 'border-2 border-dashed border-border bg-surface-2 group-hover:border-[#6F66FF] group-hover:bg-[#6F66FF]/5'
                    }`}>
                        {preview ? (
                            <img
                                src={getOptimizedImageUrl(preview, { width: 160, height: 160 })}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UploadCloud className="w-6 h-6 text-text-subtle group-hover:text-[#6F66FF] transition-colors" />
                        )}
                    </div>
                    {preview && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all rounded-xl flex items-center justify-center">
                            <UploadCloud className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    )}
                    <input id="profile-picture-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text mb-1">
                        {preview ? 'Profile photo' : 'Add a profile photo'}
                    </p>
                    <p className="text-xs text-text-muted mb-2.5">
                        {preview
                            ? 'Tap to change or pick an avatar'
                            : 'Upload a photo or choose an avatar below'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {PREDEFINED_AVATARS.map((avatar, idx) => {
                            const active = basicInfo.profilePicture?.avatarUrl === avatar;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectPredefinedAvatar(avatar)}
                                    className={`w-9 h-9 rounded-lg overflow-hidden transition-all duration-200 ${
                                        active
                                            ? 'ring-2 ring-[#6F66FF] ring-offset-2 ring-offset-bg scale-105'
                                            : 'ring-1 ring-border hover:ring-[#6F66FF]/40 hover:scale-105'
                                    }`}
                                >
                                    <img src={avatar} className="w-full h-full object-cover" alt="" />
                                </button>
                            );
                        })}
                        {preview && (
                            <button
                                type="button"
                                onClick={() => document.getElementById('profile-picture-input')?.click()}
                                className="w-9 h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-text-subtle hover:border-[#6F66FF]/40 hover:text-[#6F66FF] transition-all"
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Department & Year */}
            <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup label="Department" required>
                    <Select
                        value={basicInfo.department}
                        onChange={(e) => setBasicInfo((prev) => ({ ...prev, department: e.target.value }))}
                        options={departmentOptions}
                        placeholder="Select department"
                    />
                </FieldGroup>

                <FieldGroup label="Year of study" required>
                    <Select
                        value={basicInfo.year}
                        onChange={(e) => setBasicInfo((prev) => ({ ...prev, year: e.target.value }))}
                        options={yearOptions.map((y) => ({ value: y, label: `Year ${y}` }))}
                        placeholder="Select year"
                    />
                </FieldGroup>
            </div>

            {/* Bio */}
            <FieldGroup label="Bio" required={false} description="Tell the community what excites you.">
                <div className="relative">
                    <textarea
                        rows={3}
                        maxLength={150}
                        value={basicInfo.bio}
                        onChange={(e) => setBasicInfo((prev) => ({ ...prev, bio: e.target.value }))}
                        className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-[#6F66FF]/20 focus:border-[#6F66FF] transition-all resize-none placeholder:text-text-subtle bg-white/60 backdrop-blur-md border-white/30"
                        placeholder="I'm excited to learn about..."
                    />
                    <span className={`absolute bottom-2.5 right-3 text-[10px] font-medium transition-colors ${
                        basicInfo.bio.length > 130 ? 'text-amber-500' : 'text-text-subtle'
                    }`}>
                        {basicInfo.bio.length}/150
                    </span>
                </div>
            </FieldGroup>
        </div>
    );
}
