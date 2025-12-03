import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MentorsList({ mentors, onFollow }) {
    const navigate = useNavigate();

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-800 tracking-tight">Mentors</h3>
                <button
                    onClick={() => navigate('/mentors')}
                    className="text-xs font-bold text-white bg-[#A9C1F7] px-4 py-2 rounded-full hover:bg-[#8FB0F5] transition-all shadow-sm hover:shadow-md"
                >
                    View All
                </button>
            </div>

            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 space-y-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                {mentors.map((mentor) => (
                    <div
                        key={mentor.id}
                        onClick={() => navigate(`/profile/${mentor.id}`)}
                        className="flex items-center gap-4 cursor-pointer hover:bg-[#F5F6FA] p-3 rounded-2xl transition-all group"
                    >
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-black/5 shadow-sm group-hover:scale-105 transition-transform">
                            {mentor.profilePicture ? (
                                <img
                                    src={mentor.profilePicture}
                                    alt={mentor.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold">
                                    {mentor.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{mentor.name}</h4>
                            <p className="text-xs text-gray-400 font-medium">{mentor.department || 'UI/UX Design'}</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFollow && onFollow(mentor.id);
                            }}
                            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${mentor.isFollowing
                                ? 'bg-transparent text-gray-400 hover:text-gray-600'
                                : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            {mentor.isFollowing ? 'Followed' : '+ Follow'}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
