import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Video,
    Users,
    FileText,
    CheckCircle,
    Star,
    ExternalLink,
    HelpCircle,
    AlertTriangle,
    Download,
    Share2,
    Heart,
    MoreHorizontal,
    PlayCircle,
    Code
} from "lucide-react";
import { apiCall } from '../../../utils/api';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';

const WriteReview = ({ sessionId, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert("Please select a rating");
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
            alert(error.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h4>
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
                                    : "fill-gray-200 text-gray-200"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this session..."
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-32"
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAnonymous ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                            {isAnonymous && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Post Anonymously</span>
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

const ReviewsSection = ({ session, onReviewSubmit }) => {
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
                <h4 className="text-xl font-bold text-gray-900">Student Reviews</h4>
            </div>

            {canReview && (
                <WriteReview sessionId={session.id} onReviewSubmit={handleReviewSubmitSuccess} />
            )}

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 bg-gray-50 p-6 rounded-2xl h-fit">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <span className="text-5xl font-bold text-gray-900">{session.mentor?.averageRating?.toFixed(1) || "0.0"}</span>
                        <div className="flex gap-1 my-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className={`w-5 h-5 ${i <= Math.round(session.mentor?.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Session Rating</span>
                    </div>
                </div>

                <div className="w-full md:w-2/3 space-y-6">
                    {isLoading ? (
                        <p className="text-gray-500">Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                        <>
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
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
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-lg">
                                                        {review.author.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">{review.author.name}</h5>
                                                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={14} className={`${i <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="pt-4 text-center">
                                    <button
                                        onClick={loadMoreReviews}
                                        disabled={isMoreLoading}
                                        className="text-indigo-600 font-bold hover:text-indigo-700 disabled:opacity-50"
                                    >
                                        {isMoreLoading ? 'Loading...' : 'Load More Reviews'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl">
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
            alert('Report submitted successfully.');
            setIsReportModalOpen(false);
            setReportReason('');
        } catch (error) {
            alert(error.message || 'Failed to submit report');
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
        alert("Review submitted successfully!");
    };

    const isSessionTimeOver = new Date(new Date(S.scheduledAt).getTime() + S.duration * 60000) < new Date();

    return (
        <div className="min-h-screen bg-[#F8F9FC]">
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="font-medium">Back to Dashboard</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
                                <Share2 size={20} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                <Heart size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    <div className="lg:col-span-8 space-y-8">

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${S.mode === "ONLINE" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                                        }`}>
                                        {S.mode} Session
                                    </span>
                                    {S.isBooked && (
                                        <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                                            <CheckCircle size={12} /> Enrolled
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                                    {S.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <Calendar className="text-indigo-500" size={18} />
                                        <span className="font-medium text-sm">{new Date(S.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <Clock className="text-purple-500" size={18} />
                                        <span className="font-medium text-sm">{new Date(S.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {S.duration} min</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                About this Session
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {S.description}
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                                What You'll Learn
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(() => {
                                    let topics = [];
                                    try {
                                        topics = typeof S.topics === 'string' ? JSON.parse(S.topics) : S.topics;
                                    } catch (e) {
                                        console.error("Error parsing topics", e);
                                    }
                                    return Array.isArray(topics) ? topics.map((t, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                            <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle size={12} className="text-green-600" />
                                            </div>
                                            <span className="font-medium text-gray-700">{t}</span>
                                        </div>
                                    )) : <div className="text-gray-500">No topics listed</div>;
                                })()}
                            </div>
                        </div>

                        {S.isBooked && (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Download className="w-5 h-5 text-gray-400" />
                                    Course Materials
                                </h3>

                                <div className="flex gap-4 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
                                    <button
                                        onClick={() => { setShowResources(true); setShowQuizzes(false); setShowCoding(false); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${showResources ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Resources
                                    </button>
                                    <button
                                        onClick={() => { setShowResources(false); setShowQuizzes(true); setShowCoding(false); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${showQuizzes ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Quizzes
                                    </button>
                                    <button
                                        onClick={() => { setShowResources(false); setShowQuizzes(false); setShowCoding(true); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${showCoding ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                                                className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all group bg-white"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{file.title}</h4>
                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{file.fileType}</p>
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Download size={18} />
                                                </div>
                                            </a>
                                        )) : <p className="text-gray-500 text-center py-8">No resources available.</p>
                                    )}

                                    {showQuizzes && (
                                        S.quizzes && S.quizzes.length > 0 ? S.quizzes.map((q) => (
                                            <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/5 transition-all group bg-white"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                        <HelpCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{q.title}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                {q.status}
                                                            </span>
                                                            {q.questions && <span className="text-xs text-gray-400">• {q.questions} Questions</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {q.status === 'LIVE' && (
                                                    <button
                                                        onClick={() => window.open(`/quiz/${q.id}/attempt`, '_blank')}
                                                        className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2"
                                                    >
                                                        <PlayCircle size={16} /> Start
                                                    </button>
                                                )}
                                            </div>
                                        )) : <p className="text-gray-500 text-center py-8">No quizzes available.</p>
                                    )}

                                    {showCoding && (
                                        S.codingQuestions && S.codingQuestions.length > 0 ? S.codingQuestions.map((q) => (
                                            <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all group bg-white">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                        <Code size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{q.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' :
                                                                q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                {q.difficulty}
                                                            </span>
                                                            {q.isSolved && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                                                                    <CheckCircle size={10} /> Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => window.open(`/coding/${q.id}/attempt`, '_blank')}
                                                    className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2 ${q.isSolved
                                                        ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                                        }`}
                                                >
                                                    {q.isSolved ? <CheckCircle size={16} /> : <PlayCircle size={16} />}
                                                    {q.isSolved ? 'Solved' : 'Solve'}
                                                </button>
                                            </div>
                                        )) : <p className="text-gray-500 text-center py-8">No coding challenges available.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <ReviewsSection session={S} onReviewSubmit={handleReviewSubmit} />
                        </div>

                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start justify-between mb-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Instructor</h3>
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-bold text-yellow-700">{S.mentor.averageRating ? S.mentor.averageRating.toFixed(1) : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-4 ring-gray-50">
                                        <img
                                            src={getOptimizedImageUrl(S.mentor.profilePicture, { width: 192, height: 192 })}
                                            width={96}
                                            height={96}
                                            loading="lazy"
                                            alt={S.mentor.name || "Mentor profile picture"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">{S.mentor.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">{S.mentor.department}</p>
                                </div>

                                <button
                                    onClick={() => window.open(`/profile/${S.mentor.id}`, '_blank')}
                                    className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                                >
                                    View Profile <ExternalLink size={14} />
                                </button>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white/50">
                                <div className="mb-8">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Registration Fee</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-gray-900 tracking-tight">
                                            {S.priceType === 'FREE' ? 'Free' : `₹${S.price}`}
                                        </span>
                                        {S.priceType === 'PAID' && <span className="text-gray-400 text-sm font-medium">per person</span>}
                                    </div>
                                </div>

                                <div className="space-y-5 mb-8 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2 font-medium"><Users className="w-4 h-4" /> Seats Available</span>
                                        <span className="font-bold text-gray-900">{S.availableSeats} <span className="text-gray-400 font-normal">/ {S.maxSeats}</span></span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${((S.maxSeats - S.availableSeats) / S.maxSeats) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-gray-400 font-medium">
                                        {S.availableSeats < 5 ? '🔥 Selling out fast!' : 'Book your spot now'}
                                    </p>
                                </div>

                                {S.isBooked ? (
                                    <div className="space-y-4">
                                        <button
                                            disabled
                                            className="w-full bg-green-50 text-green-600 border border-green-200 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Registered
                                        </button>

                                        {S.status === 'COMPLETED' || new Date(new Date(S.scheduledAt).getTime() + S.duration * 60000) < new Date() ? (
                                            <button
                                                disabled
                                                className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Session Completed
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => window.open(`/session/${S.id}/live`, '_blank')}
                                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2.5 animate-pulse"
                                            >
                                                <Video className="w-5 h-5" />
                                                Join Live Class
                                            </button>
                                        )}
                                    </div>
                                ) : user?.role === 'MENTOR' ? (
                                    <button
                                        disabled
                                        className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                                    >
                                        Register Now (Disabled for Mentors)
                                    </button>
                                ) : isSessionTimeOver ? (
                                    <button
                                        disabled
                                        className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                                    >
                                        Registration Closed
                                    </button>
                                ) : (
                                    <button
                                        onClick={onRegister}
                                        disabled={S.availableSeats === 0 || isRegistering}
                                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1
                                            ${S.availableSeats === 0
                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-2xl shadow-gray-400/20'}`}
                                    >
                                        {S.availableSeats === 0 ? 'Full' : isRegistering ? 'Registering...' : 'Register Now'}
                                    </button>
                                )}

                                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                    <button
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="text-gray-400 text-xs font-bold hover:text-red-500 transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wider group"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5 group-hover:animate-bounce" />
                                        Report an issue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500 w-6 h-6" />
                            Report Session
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Please describe the issue with this session. Our team will review your report.
                        </p>
                        <form onSubmit={handleReportSubmit}>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Describe the issue..."
                                required
                                rows={4}
                                className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 mb-6 resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="flex-1 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}