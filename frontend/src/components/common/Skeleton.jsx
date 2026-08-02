import React from 'react';

export function SkeletonBase({ className = '' }) {
    return (
        <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl ${className}`} />
    );
}

export function TitleSkeleton({ title = 'w-56 h-8', sub = 'w-80 h-4' }) {
    return (
        <header className="mb-8 space-y-2">
            <SkeletonBase className={title} />
            <SkeletonBase className={sub} />
        </header>
    );
}