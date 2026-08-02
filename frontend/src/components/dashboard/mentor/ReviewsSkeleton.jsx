import React from 'react';
import { SkeletonBase } from '../../common/Skeleton';

export default function ReviewsSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <SkeletonBase className="w-52 h-8" />
                <SkeletonBase className="w-72 h-4 mt-2 max-w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-3 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                        <SkeletonBase className="w-24 h-4" />
                        <SkeletonBase className="w-16 h-9" />
                        <SkeletonBase className="w-36 h-4" />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <SkeletonBase className="w-36 h-6" />
                    <SkeletonBase className="w-32 h-9 rounded-lg" />
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                            <SkeletonBase className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <SkeletonBase className="w-28 h-4" />
                                    <SkeletonBase className="w-24 h-3" />
                                </div>
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, s) => (
                                        <SkeletonBase key={s} className="w-4 h-4 rounded-full" />
                                    ))}
                                </div>
                                <SkeletonBase className="w-full h-16 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
