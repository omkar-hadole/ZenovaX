import React from 'react';

export default function SessionSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-black/5 dark:border-white/5 shadow-sm h-[22rem] flex flex-col justify-between animate-pulse">
            <div>
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                        <div className="space-y-2">
                            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
                        </div>
                    </div>
                    <div className="w-20 h-6 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
                </div>

                <div className="w-3/4 h-7 bg-gray-200 dark:bg-gray-800 rounded-full mb-3" />
                <div className="space-y-2 mb-6">
                    <div className="w-full h-4 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
                    <div className="w-2/3 h-4 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
                </div>

                <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="w-24 h-4 bg-gray-100 dark:bg-gray-800/60 rounded" />
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="w-20 h-4 bg-gray-100 dark:bg-gray-800/60 rounded" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-28 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
        </div>
    );
}
