import React from 'react';
import { SkeletonBase } from '../common/Skeleton';

export default function MentorCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-[20rem] flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-gray-800/60 rounded-bl-full -mr-10 -mt-10" />
            <SkeletonBase className="w-24 h-24 rounded-2xl mb-4 relative z-10" />
            <SkeletonBase className="h-7 w-40 rounded-full mb-2 relative z-10" />
            <SkeletonBase className="h-4 w-24 rounded-full mb-6 relative z-10" />
            <div className="flex gap-4 w-full justify-center mb-6 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <SkeletonBase className="h-5 w-10" />
                    <SkeletonBase className="h-3 w-12" />
                </div>
                <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
                <div className="flex flex-col items-center gap-2">
                    <SkeletonBase className="h-5 w-10" />
                    <SkeletonBase className="h-3 w-14" />
                </div>
            </div>
            <div className="w-full h-12 rounded-xl relative z-10 mt-auto">
                <SkeletonBase className="w-full h-full" />
            </div>
        </div>
    );
}