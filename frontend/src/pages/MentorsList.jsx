import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { Search, Filter, Star, MapPin, Briefcase, User } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import InlineError from '../components/InlineError';
import { getOptimizedImageUrl } from '../utils/cloudinary';

export default function MentorsList() {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall('/profile/mentors');
            setMentors(response.mentors || []);
        } catch (error) {
            console.error("Failed to fetch mentors", error);
            setError(error.message || "Failed to fetch mentors");
        } finally {
            setLoading(false);
        }
    };

    const filteredMentors = mentors.filter(mentor => {
        const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mentor.department && mentor.department.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterDepartment === 'All' || mentor.department === filterDepartment;
        return matchesSearch && matchesFilter;
    });

    const departments = ['All', ...new Set(mentors.map(m => m.department).filter(Boolean))];

    const totalPages = Math.ceil(filteredMentors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMentors = filteredMentors.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDepartment]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Mentor</h1>
                    <p className="text-gray-500">Connect with experienced professionals to guide your journey</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search mentors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none w-64 transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-white cursor-pointer transition-all"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-[22rem] flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-10 -mt-10" />

                            <div className="w-24 h-24 rounded-2xl bg-gray-200 mb-4 animate-pulse relative z-10" />

                            <div className="h-7 w-40 bg-gray-200 rounded-full mb-2 animate-pulse relative z-10" />
                            <div className="h-4 w-24 bg-gray-100 rounded-full mb-6 animate-pulse relative z-10" />

                            <div className="flex gap-4 w-full justify-center mb-8 relative z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                                </div>
                            </div>

                            <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse mt-auto relative z-10" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <InlineError message={error} onRetry={fetchMentors} />
            ) : filteredMentors.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentMentors.map((mentor) => (
                            <div
                                key={mentor.id}
                                onClick={() => navigate(`/profile/${mentor.id}`)}
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-4 ring-gray-50 group-hover:ring-indigo-50 transition-all">
                                        {mentor.profilePicture ? (
                                            <img
                                                src={getOptimizedImageUrl(mentor.profilePicture, { width: 192, height: 192 })}
                                                width={96}
                                                height={96}
                                                loading="lazy"
                                                alt={mentor.name || "Mentor profile picture"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white text-2xl font-bold">
                                                {mentor.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{mentor.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {mentor.department || 'Mentor'}
                                    </p>

                                    <div className="flex items-center gap-4 mb-6 w-full justify-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span>{mentor.averageRating?.toFixed(1) || 'N/A'}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">Rating</span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                <User className="w-4 h-4 text-indigo-500" />
                                                <span>{mentor.totalSessions || 0}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">Sessions</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 rounded-xl bg-gray-50 text-gray-900 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm hover:shadow-indigo-200">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No mentors found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
