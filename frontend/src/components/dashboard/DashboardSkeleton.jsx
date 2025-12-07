import React from 'react';

const SkeletonBase = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

export default function DashboardSkeleton() {
    return (
        <div className="animate-in fade-in duration-500 space-y-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                        <SkeletonBase className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2">
                            <SkeletonBase className="w-24 h-4" />
                            <SkeletonBase className="w-16 h-8" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-64 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-3">
                                <SkeletonBase className="w-32 h-6 rounded-full" />
                                <SkeletonBase className="w-64 h-10" />
                                <div className="flex gap-4 pt-2">
                                    <SkeletonBase className="w-24 h-5" />
                                    <SkeletonBase className="w-24 h-5" />
                                </div>
                            </div>
                            <SkeletonBase className="w-40 h-12 rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <SkeletonBase className="w-14 h-14 rounded-xl" />
                                    <div className="space-y-2">
                                        <SkeletonBase className="w-48 h-5" />
                                        <div className="flex gap-3">
                                            <SkeletonBase className="w-20 h-4" />
                                            <SkeletonBase className="w-16 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <SkeletonBase className="w-10 h-10 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <SkeletonBase className="w-32 h-6 mb-4" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <SkeletonBase key={i} className="h-24 rounded-xl" />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <SkeletonBase className="w-40 h-6 mb-2" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="space-y-2 w-full">
                                    <SkeletonBase className="w-full h-4" />
                                    <SkeletonBase className="w-2/3 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
