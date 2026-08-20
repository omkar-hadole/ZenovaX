import React from 'react';
import { ArrowUp, Check, GraduationCap, MapPin, Monitor, Users, EyeOff } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';
import { stripMarkdown } from '../../../utils/descriptionFormatter';

const MODE_LABEL = {
    ONLINE: { label: 'Online', Icon: Monitor },
    OFFLINE: { label: 'Offline', Icon: MapPin },
    EITHER: { label: 'Either', Icon: Monitor },
};

export default function LearningRequestCard({ request, onOpen, onToggleInterest, isUpdatingInterest }) {
    const mode = MODE_LABEL[request.preferredMode] || MODE_LABEL.EITHER;
    const ModeIcon = mode.Icon;
    const isCreator = request.isCreator;
    const isCreatorProfile = request.isAnonymous ? null : request.creator?.profilePicture;
    const creatorName = request.isAnonymous ? 'Anonymous' : (request.creator?.name || 'A learner');
    const creatorMeta = request.isAnonymous ? 'Identity hidden' : (
        [request.creator?.department, request.creator?.year ? `Year ${request.creator.year}` : null]
            .filter(Boolean)
            .join(' · ') || 'Learner'
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-transform duration-300 group flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
                        {isCreatorProfile ? (
                            <img
                                src={getOptimizedImageUrl(isCreatorProfile, { width: 96, height: 96 })}
                                width={48}
                                height={48}
                                loading="lazy"
                                alt={creatorName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${request.isAnonymous ? 'bg-gray-200/70 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500' : 'bg-[#C9C7F5]/20 text-[#5a59b5]'}`}>
                                {request.isAnonymous ? <EyeOff className="w-5 h-5" /> : (creatorName?.[0] || 'L')}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-1.5">
                            {creatorName}
                        
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{creatorMeta}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="bg-[#F5F6FA] dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                        <ModeIcon className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {mode.label}
                    </span>
                    {isCreator && (
                        <span className="bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 text-[#5a59b5] dark:text-[#9190F8] text-xs font-bold px-3 py-1 rounded-full">
                            You requested
                        </span>
                    )}
                </div>
            </div>

            <button onClick={() => onOpen(request)} className="text-left">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {request.topic}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed flex-1">
                    {stripMarkdown(request.description) || 'Join this learning request to show your interest.'}
                </p>
            </button>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4 bg-[#F5F6FA] dark:bg-gray-800/60 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">{request.interestCount} interested</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto gap-2">
                {request.status === 'OPEN' ? (
                    <button
                        onClick={() => onToggleInterest(request)}
                        disabled={isUpdatingInterest}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 disabled:opacity-60 ${
                            request.isInterested
                                ? 'bg-[#C9C7F5]/30 text-[#5a59b5] dark:bg-[#C9C7F5]/10 dark:text-[#9190F8] hover:bg-[#C9C7F5]/40'
                                : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100'
                        }`}
                    >
                        {request.isInterested ? <Check className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                        {request.isInterested ? 'Interested' : "I'm Interested"}
                    </button>
                ) : (
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Session available</span>
                )}
                <button
                    onClick={() => onOpen(request)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                    View
                </button>
            </div>
        </div>
    );
}