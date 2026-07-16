import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    Star,
    HelpCircle,
    AlertTriangle,
    Download,
    Share2,
    Heart,
    PlayCircle,
    Code
} from "lucide-react";
import { apiCall } from '../../../utils/api';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';
import Toast from '../../Toast';
import SessionPreviewContent from '../../common/SessionPreviewContent';

const WriteReview = ({ sessionId, onReviewSubmit, onShowToast }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0) {
            onShowToast({ message: "Please select a rating", type: "error" });
            return;
        }
        setIsSubmitting(true);
        try {
            await apiCall('/reviews/create', {
                method: 'POST',
                body: JSON.stringify({ sessionId, rating, comment, isAnonymous })
            });
            onReviewSubmit();
            setRating(0);
            setComment('');
            setIsAnonymous(false);
        } catch (error) {
            onShowToast({ message: error.message || "Failed to submit review", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Write a Review</h4>
            <div className="space-y-4">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= (hoveredStar || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this session..."
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/20 outline-none transition-all resize-none h-32"
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAnonymous ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 group-hover:border-indigo-400'}`}>
                            {isAnonymous && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Post Anonymously</span>
                    </label>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReviewsSection = ({ session, onReviewSubmit, onShowToast }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, distribution: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    const isSessionEnded = new Date(new Date(session.scheduledAt).getTime() + session.duration * 60000) < new Date();
    const canReview = session.isBooked && !session.hasReviewed && isSessionEnded;

    const fetchReviews = async (pageNum = 1, reset = false) => {
        try {
            if (pageNum > 1) setIsMoreLoading(true);
            const data = await apiCall(`/reviews/session/${session.id}?page=${pageNum}&limit=5`);
            const fetchedReviews = data.reviews || [];

            if (reset) {
                setReviews(fetchedReviews);
            } else {
                setReviews(prev => [...prev, ...fetchedReviews]);
            }

            setHasMore(data.pagination?.page < data.pagination?.totalPages);
            setPage(pageNum);

            fetchStats();

        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    const fetchStats = async () => {
    };

    useEffect(() => {
        fetchReviews(1, true);
    }, [session.id]);

    const handleReviewSubmitSuccess = () => {
        onReviewSubmit();
        fetchReviews(1, true);
    };

    const loadMoreReviews = () => {
        if (!isMoreLoading && hasMore) {
            fetchReviews(page + 1);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Student Reviews</h4>
            </div>

            {canReview && (
                <WriteReview sessionId={session.id} onReviewSubmit={handleReviewSubmitSuccess} onShowToast={onShowToast} />
            )}

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-800/60 p-6 rounded-2xl h-fit">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">{session.mentor?.averageRating?.toFixed(1) || "0.0"}</span>
                        <div className="flex gap-1 my-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className={`w-5 h-5 ${i <= Math.round(session.mentor?.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`} />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Session Rating</span>
                    </div>
                </div>

                <div className="w-full md:w-2/3 space-y-6">
                    {isLoading ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                        <>
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                {review.author.profilePicture ? (
                                                    <img
                                                        src={getOptimizedImageUrl(review.author.profilePicture, { width: 80, height: 80 })}
                                                        width={40}
                                                        height={40}
                                                        loading="lazy"
                                                        alt={review.author.name || "Review author avatar"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                                        {review.author.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{review.author.name}</h5>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={14} className={`${i <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="pt-4 text-center">
                                    <button
                                        onClick={loadMoreReviews}
                                        disabled={isMoreLoading}
                                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50"
                                    >
                                        {isMoreLoading ? 'Loading...' : 'Load More Reviews'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
                            <p>No reviews yet. Be the first to review!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function SessionDetailsView({ session, onBack, onRegister, isRegistering, user }) {
    const [showResources, setShowResources] = useState(true);
    const [showQuizzes, setShowQuizzes] = useState(false);
    const [showCoding, setShowCoding] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [showReviews, setShowReviews] = useState(false);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [toast, setToast] = useState(null);

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/reports/create', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: session.id,
                    reason: reportReason
                })
            });
            setToast({ message: 'Report submitted successfully.', type: 'success' });
            setIsReportModalOpen(false);
            setReportReason('');
        } catch (error) {
            setToast({ message: error.message || 'Failed to submit report', type: 'error' });
        }
    };

    if (!session) return null;

    const mockSession = {
        id: "session123",
        title: "Advanced React Patterns & Performance Optimization",
        description:
            "Master the art of building scalable React applications. In this comprehensive session, we'll dive deep into custom hooks, context optimization, suspense, error boundaries, and advanced performance tuning techniques used by top tech companies.",
        mode: "ONLINE",
        scheduledAt: new Date().toISOString(),
        duration: 90,
        priceType: "PAID",
        price: 499,
        maxSeats: 40,
        availableSeats: 8,
        isBooked: false,
        hasReviewed: false,
        status: "UPCOMING",
        topics: ["Custom Hooks & Composition", "Context API Performance", "Server Components", "Code Splitting & Suspense"],
        mentor: {
            name: "Sarah Johnson",
            profilePicture:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            averageRating: 4.9,
            id: "mentor1",
            department: "Senior React Developer",
        },
        resources: [
            { id: 1, title: "React Patterns Guide.pdf", fileType: "PDF", fileUrl: "#" },
            { id: 2, title: "Source Code Repository", fileType: "LINK", fileUrl: "#" },
            { id: 3, title: "Performance Checklist", fileType: "DOC", fileUrl: "#" },
        ],
        quizzes: [
            { id: 1, title: "React Fundamentals Check", status: "LIVE", questions: 10 },
            { id: 2, title: "Advanced Concepts", status: "DRAFT", questions: 15 },
        ],
    };

    const S = session || mockSession;

    const handleReviewSubmit = () => {
        setReviewSubmitted(true);
        S.hasReviewed = true;
        setToast({ message: "Review submitted successfully!", type: "success" });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="font-medium">Back to Dashboard</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all">
                                <Share2 size={20} />
                            </button>
                            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all">
                                <Heart size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SessionPreviewContent
                    session={S}
                    onRegister={onRegister}
                    isRegistering={isRegistering}
                    onReport={() => setIsReportModalOpen(true)}
                    userRole={user?.role}
                    userId={user?.id}
                >
                    {S.isBooked && (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <Download className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                Course Materials
                            </h3>

                            <div className="flex gap-4 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                                <button
                                    onClick={() => { setShowResources(true); setShowQuizzes(false); setShowCoding(false); }}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${showResources ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    {S.resources && S.resources.length > 0 && (
                                        <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${showResources ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                            {S.resources.length}
                                        </span>
                                    )}
                                    Resources
                                </button>
                                <button
                                    onClick={() => { setShowResources(false); setShowQuizzes(true); setShowCoding(false); }}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${showQuizzes ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    {S.quizzes && S.quizzes.length > 0 && (
                                        <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${showQuizzes ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                            {S.quizzes.length}
                                        </span>
                                    )}
                                    Quizzes
                                </button>
                                <button
                                    onClick={() => { setShowResources(false); setShowQuizzes(false); setShowCoding(true); }}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${showCoding ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    Coding
                                    {S.codingQuestions && S.codingQuestions.length > 0 && (
                                        <span className="ml-2 text-xs opacity-70">
                                            ({S.codingQuestions.filter(q => q.isSolved).length}/{S.codingQuestions.length})
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {showResources && (
                                    S.resources && S.resources.length > 0 ? S.resources.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 transition-all group bg-white dark:bg-gray-900"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{file.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{file.fileType}</p>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                <Download size={18} />
                                            </div>
                                        </a>
                                    )) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No resources available.</p>
                                )}

                                {showQuizzes && (
                                    S.quizzes && S.quizzes.length > 0 ? S.quizzes.map((q) => (
                                        <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5 transition-all group bg-white dark:bg-gray-900"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                                    <HelpCircle size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{q.title}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.status === 'LIVE' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                                            {q.status}
                                                        </span>
                                                        {q.questions && <span className="text-xs text-gray-400 dark:text-gray-500">• {q.questions} Questions</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {q.status === 'LIVE' && (
                                                <button
                                                    onClick={() => window.open(`/quiz/${q.id}/attempt`, '_blank')}
                                                    className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-purple-950/50 flex items-center gap-2"
                                                >
                                                    <PlayCircle size={16} /> Start
                                                </button>
                                            )}
                                        </div>
                                    )) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No quizzes available.</p>
                                )}

                                {showCoding && (
                                    S.codingQuestions && S.codingQuestions.length > 0 ? S.codingQuestions.map((q) => (
                                        <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5 transition-all group bg-white dark:bg-gray-900">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Code size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{q.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.difficulty === 'HARD' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
                                                            q.difficulty === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                                                                'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                                            }`}>
                                                            {q.difficulty}
                                                        </span>
                                                        {q.isSolved && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                                                                <CheckCircle size={10} /> Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => window.open(`/coding/${q.id}/attempt`, '_blank')}
                                                className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2 ${q.isSolved
                                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-green-950/50'
                                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-950/50'
                                                    }`}
                                            >
                                                {q.isSolved ? <CheckCircle size={16} /> : <PlayCircle size={16} />}
                                                {q.isSolved ? 'Solved' : 'Solve'}
                                            </button>
                                        </div>
                                    )) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No coding challenges available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <ReviewsSection session={S} onReviewSubmit={handleReviewSubmit} onShowToast={setToast} />
                    </div>
                </SessionPreviewContent>
            </div>

            {isReportModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
                    onClick={() => setIsReportModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500 w-6 h-6" />
                            Report Session
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Please describe the issue with this session. Our team will review your report.
                        </p>
                        <form onSubmit={handleReportSubmit}>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Describe the issue..."
                                required
                                rows={4}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none rounded-xl focus:ring-2 focus:ring-red-500 mb-6 resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="flex-1 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div >
    );
}
