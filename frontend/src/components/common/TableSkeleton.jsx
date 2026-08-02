import React from 'react';

export function TableSkeleton({ rows = 4, cols = 4 }) {
    return (
        <div className="p-6">
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex items-center gap-6">
                        {Array.from({ length: cols }).map((_, c) => (
                            <div
                                key={c}
                                className="h-4 bg-slate-100 dark:bg-gray-800 animate-pulse rounded"
                                style={{ width: c === 0 ? '28%' : c === cols - 1 ? '14%' : '22%' }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}