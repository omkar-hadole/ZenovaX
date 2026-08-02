import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, MessageSquare, ThumbsUp } from 'lucide-react';
import { apiCall } from '../../../utils/api';
import InlineError from '../../InlineError';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';
import { SkeletonBase } from '../../common/Skeleton';

export default function ReviewsReceived() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const [reviewsData, statsData] = await Promise.all([
                apiCall('/reviews/my-reviews'),
                apiCall('/sessions/stats')
            ]);

            setReviews(reviewsData.reviews || []);
            if (statsData.stats) {
                setStats({
                    averageRating: statsData.stats.averageRating,
                    totalReviews: reviewsData.reviews.length
                });
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            setError(error.message || 'Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const [sortBy, setSortBy] = useState('Newest First');

    const getSortedReviews = () => {
        const sorted = [...reviews];
        switch (sortBy) {
            case 'Highest Rated':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'Lowest Rated':
                return sorted.sort((a, b) => a.rating - b.rating);
            case 'Newest First':
            default:
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    const sortedReviews = getSortedReviews();

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <SkeletonBase className="w-52 h-8" />
                    <SkeletonBase className="w-72 h-4 mt-2 max-w-full" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                            <SkeletonBase className="w-24 h-4" />
                            <SkeletonBase className="w-16 h-9" />
                            <SkeletonBase className="w-36 h-4" />
                        </div>
                    ))}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <SkeletonBase className="w-36 h-6" />
                        <SkeletonBase className="w-32 h-9 rounded-lg" />
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 sm:p-6 flex items-start gap-4">
                                <SkeletonBase className="w-12 h-12 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <SkeletonBase className="w-28 h-4" />
                                        <SkeletonBase className="w-16 h-4" />
                                    </div>
                                    <SkeletonBase className="w-full h-4" />
                                    <SkeletonBase className="w-2/3 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <InlineError message={error} onRetry={fetchReviews} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reviews & Feedback</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">See what your learners are saying about your sessions</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#C9C7F5]/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9C7F5]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 relative z-10 truncate">Average Rating</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{stats.averageRating.toFixed(1)}</span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#F7D483]/20 rounded-lg shrink-0">
                            <Star className="w-4 h-4 text-[#b59a5a] fill-current" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#A9C1F7]/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#A9C1F7]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 relative z-10 truncate">Total Reviews</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{reviews.length}</span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#A9C1F7]/20 rounded-lg text-[#4a7ac7] shrink-0">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#F7D483]/20 relative overflow-hidden group hover:shadow-md transition-all col-span-2 md:col-span-1">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F7D483]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 relative z-10 truncate">Positive Feedback</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
                            {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
                        </span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#F7D483]/20 rounded-lg text-[#b59a5a] shrink-0">
                            <ThumbsUp className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Recent Reviews</h3>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800/60 border-none text-sm text-gray-500 dark:text-gray-400 font-medium rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <option>Newest First</option>
                        <option>Highest Rated</option>
                        <option>Lowest Rated</option>
                    </select>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {sortedReviews.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No reviews yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Reviews will appear here once learners rate your sessions.</p>
                        </div>
                    ) : (
                        sortedReviews.map((review) => (
                            <div key={review.id} className="p-4 sm:p-6 hover:bg-[#F4F4F9]/50 dark:hover:bg-gray-800/40 transition-colors group">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    {review.author.profilePicture ? (
                                        <img
                                            src={getOptimizedImageUrl(review.author.profilePicture, { width: 96, height: 96 })}
                                            width={48}
                                            height={48}
                                            loading="lazy"
                                            alt={review.author.name || "Review author avatar"}
                                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-900 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-[#C9C7F5]/20 flex items-center justify-center text-[#5a59b5] ring-2 ring-white dark:ring-gray-900 shadow-sm">
                                            <span className="font-bold text-lg">{review.author.name.charAt(0)}</span>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate">{review.author.name}</h4>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`${i < review.rating ? 'text-[#F7D483] fill-[#F7D483]' : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                {review.session.title}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl rounded-tl-none">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
