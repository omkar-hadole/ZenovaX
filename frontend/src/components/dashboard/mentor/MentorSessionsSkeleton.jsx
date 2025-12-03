import React from 'react';

const SkeletonBase = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

export default function MentorSessionsSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <SkeletonBase className="w-48 h-8" />
                <SkeletonBase className="w-32 h-10 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                            <SkeletonBase className="w-12 h-12 rounded-xl" />
                            <SkeletonBase className="w-20 h-6 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonBase className="w-3/4 h-6" />
                            <SkeletonBase className="w-1/2 h-4" />
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                            <SkeletonBase className="w-24 h-4" />
                            <SkeletonBase className="w-8 h-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
