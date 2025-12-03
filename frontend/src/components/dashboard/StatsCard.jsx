import React from 'react';

export default function StatsCard({ icon: Icon, iconColor, iconBgColor, trendIcon: TrendIcon, trendColor, value, label, subValue, subLabel }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                {TrendIcon && <TrendIcon className={`w-5 h-5 ${trendColor}`} />}
                {subValue && (
                    <div className="flex items-center gap-1">
                        {TrendIcon && <TrendIcon className={`w-4 h-4 ${trendColor} fill-current`} />}
                        <span className="text-sm font-semibold text-gray-700">{subValue}</span>
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}
