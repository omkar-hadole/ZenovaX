import React from 'react';
import { UploadCloud, Shield } from 'lucide-react';
import { FieldGroup } from './FormComponents';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

const departmentOptions = ['CSE', 'AI/ML', 'IT', 'BBA', 'ECON', 'DESIGN', 'PSY', 'MEDIA'];
const yearOptions = ['1', '2', '3', '4'];

export default function BasicInfoStep({ basicInfo, setBasicInfo, handleImageUpload, role }) {
    return (
        <div className="space-y-8">
            <FieldGroup label="Profile picture" required={role !== 'learner'} description="Square images (1:1) work best. Max 3MB.">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="w-28 h-28 rounded-[1.5rem] border-2 border-dashed border-[#C9C7F5] bg-white flex items-center justify-center overflow-hidden">
                        {basicInfo.profilePicture?.preview ? (
                            <img
                                src={getOptimizedImageUrl(basicInfo.profilePicture.preview, { width: 224, height: 224 })}
                                width={112}
                                height={112}
                                loading="lazy"
                                alt="Profile picture preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Shield className="w-10 h-10 text-[#C9C7F5]" />
                        )}
                    </div>
                    <div className="flex-1">
                        <input id="profile-picture-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <label
                            htmlFor="profile-picture-input"
                            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-dashed border-[#C9C7F5] text-[#5a59b5] font-bold cursor-pointer hover:bg-[#C9C7F5]/10 transition-colors"
                        >
                            <UploadCloud className="w-5 h-5" />
                            Upload new photo
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Accepted: JPG, PNG, HEIC.</p>
                    </div>
                </div>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-6">
                <FieldGroup label="Department" required>
                    <select
                        value={basicInfo.department}
                        onChange={(e) => setBasicInfo((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C9C7F5] bg-white"
                    >
                        <option value="">Select department</option>
                        {departmentOptions.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </FieldGroup>

                <FieldGroup label="Year of study" required>
                    <select
                        value={basicInfo.year}
                        onChange={(e) => setBasicInfo((prev) => ({ ...prev, year: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C9C7F5] bg-white"
                    >
                        <option value="">Select year</option>
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>
                                Year {year}
                            </option>
                        ))}
                    </select>
                </FieldGroup>
            </div>

            <FieldGroup label="Short bio" required={false} description="Tell the community what you’re excited to learn.">
                <textarea
                    rows={4}
                    maxLength={150}
                    value={basicInfo.bio}
                    onChange={(e) => setBasicInfo((prev) => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-[1.5rem] border border-gray-200 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C9C7F5] resize-none"
                    placeholder="I’m focused on building stronger fundamentals in..."
                />
                <div className="text-right text-xs text-gray-400">{150 - basicInfo.bio.length} characters left</div>
            </FieldGroup>
        </div>
    );
}
