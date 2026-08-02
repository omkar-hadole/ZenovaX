import React from 'react';
import { SkeletonBase, TitleSkeleton } from './Skeleton';
import { TableSkeleton } from './TableSkeleton';

export * from './Skeleton';
export { TableSkeleton };

export function AdminDashboardSkeleton() {
    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 sm:gap-4">
                        <SkeletonBase className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0" />
                        <div className="space-y-2">
                            <SkeletonBase className="w-20 h-3" />
                            <SkeletonBase className="w-12 h-6" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="p-6 pb-4"><SkeletonBase className="w-48 h-5" /></div>
                <div className="hidden md:block border-t border-gray-100 dark:border-gray-800"><TableSkeleton rows={5} cols={4} /></div>
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
                    {[1, 2, 3, 4].map(row => (
                        <div key={row} className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <SkeletonBase className="w-40 h-4" />
                                <SkeletonBase className="w-16 h-5 rounded-full" />
                            </div>
                            <SkeletonBase className="w-52 h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminListSkeleton({ rows = 5 }) {
    return (
        <div className="p-4 sm:p-6 animate-in fade-in duration-500">
            <SkeletonBase className="w-40 h-8 mb-6" />
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="hidden md:block">
                    <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4">
                        <div className="flex gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonBase key={i} className="h-3 w-24" />)}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {Array.from({ length: rows }).map((_, row) => (
                            <div key={row} className="px-6 py-4 flex items-center gap-6">
                                <SkeletonBase className="w-6 h-4 rounded-full" />
                                <SkeletonBase className="w-48 h-4" />
                                <SkeletonBase className="w-16 h-5 rounded-full" />
                                <SkeletonBase className="w-28 h-4" />
                                <SkeletonBase className="w-24 h-4" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {Array.from({ length: rows }).map((_, row) => (
                        <div key={row} className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <SkeletonBase className="w-40 h-4" />
                                <SkeletonBase className="w-16 h-5 rounded-full" />
                            </div>
                            <SkeletonBase className="w-52 h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminPendingSkeleton({ count = 6 }) {
    return (
        <div className="p-4 sm:p-6 animate-in fade-in duration-500">
            <TitleSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex items-start justify-between">
                            <SkeletonBase className="w-20 h-5 rounded-full" />
                            <SkeletonBase className="w-24 h-4" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonBase className="w-3/4 h-6" />
                            <SkeletonBase className="w-full h-3" />
                            <SkeletonBase className="w-2/3 h-3" />
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl flex items-center gap-3">
                            <SkeletonBase className="w-10 h-10 rounded-xl" />
                            <div className="space-y-2">
                                <SkeletonBase className="w-32 h-4" />
                                <SkeletonBase className="w-24 h-3" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <SkeletonBase className="w-24 h-9 rounded-xl" />
                            <SkeletonBase className="w-24 h-9 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AdminPaymentsSkeleton({ count = 4 }) {
    return (
        <div className="p-4 sm:p-6 animate-in fade-in duration-500">
            <TitleSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2">
                        <SkeletonBase className="w-10 h-10 rounded-xl mb-3" />
                        <SkeletonBase className="w-24 h-3" />
                        <SkeletonBase className="w-16 h-7" />
                    </div>
                ))}
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex gap-2 mb-6">
                {[1, 2, 3].map(i => <SkeletonBase key={i} className="w-28 h-9 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                        <SkeletonBase className="w-40 h-4" />
                        <SkeletonBase className="w-56 h-3" />
                        <SkeletonBase className="w-28 h-8 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AdminCardGridSkeleton({ count = 6, cols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', showSectionHeader = false }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {showSectionHeader && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <SkeletonBase className="w-48 h-8" />
                    <div className="flex gap-3">
                        <SkeletonBase className="w-40 h-10 rounded-xl" />
                        <SkeletonBase className="w-36 h-10 rounded-xl" />
                        <SkeletonBase className="w-28 h-10 rounded-xl" />
                    </div>
                </div>
            )}
            <div className={`grid ${cols} gap-6`}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex items-center gap-2">
                            <SkeletonBase className="w-16 h-5 rounded-full" />
                            <SkeletonBase className="w-14 h-5 rounded-full" />
                        </div>
                        <SkeletonBase className="w-3/4 h-6" />
                        <SkeletonBase className="w-1/2 h-3" />
                        <SkeletonBase className="w-24 h-5 rounded-lg" />
                        <div className="flex gap-2 pt-2">
                            <SkeletonBase className="w-20 h-9 rounded-xl" />
                            <SkeletonBase className="w-20 h-9 rounded-xl" />
                            <SkeletonBase className="w-20 h-9 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AdminReportManagementSkeleton() {
    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
            <TitleSkeleton sub="w-56 h-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2">
                        <SkeletonBase className="w-28 h-4" />
                        <SkeletonBase className="w-16 h-8" />
                    </div>
                ))}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <TableSkeleton rows={5} cols={5} />
            </div>
        </div>
    );
}