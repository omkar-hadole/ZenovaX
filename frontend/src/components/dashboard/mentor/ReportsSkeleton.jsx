import React from 'react';
import { SkeletonBase } from '../../common/Skeleton';

export default function ReportsSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 space-y-3">
                        <SkeletonBase className="w-28 h-4" />
                        <SkeletonBase className="w-16 h-8" />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="space-y-2">
                        <SkeletonBase className="w-40 h-5" />
                        <SkeletonBase className="w-56 h-3" />
                    </div>
                    <SkeletonBase className="w-48 h-9 rounded-xl" />
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="px-8 py-5 flex items-center gap-6">
                            <SkeletonBase className="w-1/4 h-4" />
                            <SkeletonBase className="w-1/3 h-4" />
                            <SkeletonBase className="w-20 h-4" />
                            <SkeletonBase className="w-16 h-5 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
