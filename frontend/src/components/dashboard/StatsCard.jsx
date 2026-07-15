import React from 'react';

export default function StatsCard({ icon: Icon, iconColor, iconBgColor, trendIcon: TrendIcon, trendColor, value, label, subValue, subLabel }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                {TrendIcon && <TrendIcon className={`w-5 h-5 ${trendColor}`} />}
                {subValue && (
                    <div className="flex items-center gap-1">
                        {TrendIcon && <TrendIcon className={`w-4 h-4 ${trendColor} fill-current`} />}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{subValue}</span>
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}
