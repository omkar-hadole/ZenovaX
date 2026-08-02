import React from 'react';
import { SkeletonBase } from '../../common/Skeleton';

export default function ReportsSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[0, 1, 2].map((i) => (
                    <div key={i} className={`bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 space-y-3 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                        <SkeletonBase className="w-28 h-4" />
                        <SkeletonBase className="w-16 h-8" />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <SkeletonBase className="w-40 h-5" />
                        <SkeletonBase className="w-56 h-3" />
                    </div>
                    <SkeletonBase className="w-full md:w-48 h-9 rounded-xl" />
                </div>

                <div className="hidden md:block">
                    <div className="px-8 py-4 bg-gray-50/50 dark:bg-gray-800/40">
                        <div className="flex items-center gap-6">
                            <SkeletonBase className="w-1/4 h-4" />
                            <SkeletonBase className="w-1/3 h-4" />
                            <SkeletonBase className="w-20 h-4" />
                            <SkeletonBase className="w-16 h-5 rounded-full" />
                            <SkeletonBase className="w-10 h-4" />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="px-8 py-5 flex items-center gap-6">
                                <SkeletonBase className="w-1/4 h-4" />
                                <SkeletonBase className="w-1/3 h-4" />
                                <SkeletonBase className="w-20 h-4" />
                                <SkeletonBase className="w-16 h-5 rounded-full" />
                                <SkeletonBase className="w-10 h-4" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <SkeletonBase className="w-3/4 h-4" />
                                <SkeletonBase className="w-16 h-5 rounded-full shrink-0" />
                            </div>
                            <SkeletonBase className="w-full h-3" />
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <SkeletonBase className="w-28 h-3" />
                                <SkeletonBase className="w-8 h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
