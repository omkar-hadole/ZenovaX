import React from 'react';

const SkeletonBase = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl ${className}`} />
);

export default function SessionDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950 pb-12">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-8 pt-6">
                <div className="max-w-7xl mx-auto px-6">
                    <SkeletonBase className="w-24 h-8 mb-6 rounded-full" />
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <SkeletonBase className="w-full md:w-2/3 h-12 mb-4" />
                    </div>
                    <div className="flex gap-6 mt-6">
                        <SkeletonBase className="w-32 h-6" />
                        <SkeletonBase className="w-32 h-6" />
                        <SkeletonBase className="w-32 h-6" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                        <SkeletonBase className="w-32 h-8" />
                        <div className="space-y-2">
                            <SkeletonBase className="w-full h-4" />
                            <SkeletonBase className="w-full h-4" />
                            <SkeletonBase className="w-3/4 h-4" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <SkeletonBase className="w-40 h-8 mb-6" />
                        <div className="flex items-center gap-4">
                            <SkeletonBase className="w-16 h-16 rounded-2xl" />
                            <div className="space-y-2">
                                <SkeletonBase className="w-48 h-6" />
                                <SkeletonBase className="w-32 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                        <SkeletonBase className="w-full h-64 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SkeletonBase className="w-24 h-4" />
                                <SkeletonBase className="w-24 h-4" />
                            </div>
                            <div className="flex justify-between">
                                <SkeletonBase className="w-24 h-4" />
                                <SkeletonBase className="w-24 h-4" />
                            </div>
                        </div>
                        <SkeletonBase className="w-full h-12 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
