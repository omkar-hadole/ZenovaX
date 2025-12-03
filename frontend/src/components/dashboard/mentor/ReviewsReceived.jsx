import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, MessageSquare, ThumbsUp } from 'lucide-react';
import { apiCall } from '../../../utils/api';

export default function ReviewsReceived() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9C7F5]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Reviews & Feedback</h2>
                <p className="text-gray-500 text-sm mt-1">See what your learners are saying about your sessions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#C9C7F5]/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9C7F5]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 text-sm font-medium mb-2 relative z-10">Average Rating</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-4xl font-bold text-gray-800">{stats.averageRating.toFixed(1)}</span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#F7D483]/20 rounded-lg">
                            <Star className="w-4 h-4 text-[#b59a5a] fill-current" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#A9C1F7]/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#A9C1F7]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 text-sm font-medium mb-2 relative z-10">Total Reviews</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-4xl font-bold text-gray-800">{reviews.length}</span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#A9C1F7]/20 rounded-lg text-[#4a7ac7]">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#F7D483]/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F7D483]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-gray-500 text-sm font-medium mb-2 relative z-10">Positive Feedback</h3>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-4xl font-bold text-gray-800">
                            {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
                        </span>
                        <div className="flex items-center mb-2 px-2 py-1 bg-[#F7D483]/20 rounded-lg text-[#b59a5a]">
                            <ThumbsUp className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Recent Reviews</h3>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 border-none text-sm text-gray-500 font-medium rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <option>Newest First</option>
                        <option>Highest Rated</option>
                        <option>Lowest Rated</option>
                    </select>
                </div>

                <div className="divide-y divide-gray-50">
                    {sortedReviews.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No reviews yet</h3>
                            <p className="text-gray-500 text-sm">Reviews will appear here once learners rate your sessions.</p>
                        </div>
                    ) : (
                        sortedReviews.map((review) => (
                            <div key={review.id} className="p-6 hover:bg-[#F4F4F9]/50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    {review.author.profilePicture ? (
                                        <img
                                            src={review.author.profilePicture}
                                            alt={review.author.name}
                                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-[#C9C7F5]/20 flex items-center justify-center text-[#5a59b5] ring-2 ring-white shadow-sm">
                                            <span className="font-bold text-lg">{review.author.name.charAt(0)}</span>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-800 truncate">{review.author.name}</h4>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`${i < review.rating ? 'text-[#F7D483] fill-[#F7D483]' : 'text-gray-200 fill-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {review.session.title}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl rounded-tl-none">
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
