import React from 'react';

const SkeletonBase = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl ${className}`} />
);

export default function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
                    <SkeletonBase className="w-20 h-8 rounded-full" />
                    <div className="flex gap-3">
                        <SkeletonBase className="w-10 h-10 rounded-full" />
                        <SkeletonBase className="w-32 h-10 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 h-64 relative overflow-hidden">
                            <div className="space-y-6 relative z-10">
                                <SkeletonBase className="w-24 h-6 rounded-full" />
                                <SkeletonBase className="w-64 h-12" />
                                <div className="flex gap-4">
                                    <SkeletonBase className="w-32 h-6" />
                                    <SkeletonBase className="w-32 h-6" />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <SkeletonBase className="w-28 h-10" />
                                    <SkeletonBase className="w-32 h-10" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <SkeletonBase className="w-24 h-6" />
                            <div className="space-y-2">
                                <SkeletonBase className="w-full h-4" />
                                <SkeletonBase className="w-full h-4" />
                                <SkeletonBase className="w-3/4 h-4" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <SkeletonBase className="w-32 h-6" />
                            <div className="flex flex-wrap gap-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <SkeletonBase key={i} className="w-24 h-8 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <SkeletonBase className="w-32 h-32 rounded-full mb-6" />
                            <SkeletonBase className="w-40 h-8 mb-2" />
                            <SkeletonBase className="w-24 h-4 mb-6" />

                            <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-100 dark:border-gray-800 pt-6 mb-6">
                                <div className="flex flex-col items-center gap-2">
                                    <SkeletonBase className="w-12 h-8" />
                                    <SkeletonBase className="w-16 h-3" />
                                </div>
                                <div className="flex flex-col items-center gap-2 border-l border-gray-100 dark:border-gray-800">
                                    <SkeletonBase className="w-12 h-8" />
                                    <SkeletonBase className="w-16 h-3" />
                                </div>
                            </div>

                            <div className="w-full space-y-3">
                                <SkeletonBase className="w-full h-12 rounded-xl" />
                                <SkeletonBase className="w-full h-12 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
