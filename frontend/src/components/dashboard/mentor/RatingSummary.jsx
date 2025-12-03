import React from 'react';
import { Star } from 'lucide-react';

export default function RatingSummary({ stats }) {
    if (!stats) return null;

    return (
        <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Summary</h3>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-gray-800 mb-2">{stats.averageRating?.toFixed(1) || '0.0'}</div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(stats.averageRating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500">Based on {stats.totalReviews || 0} reviews</p>
                </div>

                <div className="space-y-3">
                    {stats.distribution?.map((rating) => (
                        <div key={rating.stars} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-8">{rating.stars}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${rating.percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-500 w-8">{rating.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
