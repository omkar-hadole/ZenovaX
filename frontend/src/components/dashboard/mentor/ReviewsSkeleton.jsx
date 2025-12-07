import React from 'react';

const SkeletonBase = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

export default function ReviewsSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 h-64 flex flex-col items-center justify-center space-y-4">
                    <SkeletonBase className="w-24 h-16" />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(i => <SkeletonBase key={i} className="w-6 h-6 rounded-full" />)}
                    </div>
                    <SkeletonBase className="w-32 h-4" />
                </div>

                <div className="md:col-span-2 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <SkeletonBase className="w-12 h-12 rounded-full" />
                                    <div className="space-y-2">
                                        <SkeletonBase className="w-32 h-4" />
                                        <SkeletonBase className="w-24 h-3" />
                                    </div>
                                </div>
                                <SkeletonBase className="w-24 h-4 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <SkeletonBase className="w-full h-4" />
                                <SkeletonBase className="w-3/4 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
