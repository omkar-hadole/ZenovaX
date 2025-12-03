import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Heart,
  CheckCircle,
  Calendar,
  Clock,
  FileText,
  Download,
  HelpCircle,
  PlayCircle,
  Star,
  ExternalLink,
  Users,
  AlertTriangle,
  MapPin,
  Briefcase,
  GraduationCap,
  Linkedin,
  Phone,
  Mail,
  Edit2,
  Award,
  Camera,
  Save,
  X
} from 'lucide-react';
import { apiCall } from '../utils/api';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';

// Reusing ReviewsSection logic from SessionDetailsView but adapted for Profile
const ReviewsSection = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, distribution: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      // Fetch reviews for the mentor
      const data = await apiCall(`/reviews/mentor/${userId}`);
      const fetchedReviews = data.reviews || [];
      setReviews(fetchedReviews);

      // Fetch stats separately or calculate (using calculation here for consistency with SessionDetails)
      // Ideally backend provides stats endpoint: /reviews/stats/:mentorId
      const statsData = await apiCall(`/reviews/stats/${userId}`);
      setStats(statsData);

    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchReviews();
  }, [userId]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900">Student Reviews</h4>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Stats Column */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 rounded-2xl h-fit">
          <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-5xl font-bold text-gray-900">{stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}</span>
            <div className="flex gap-1 my-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(stats.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">{stats.totalReviews} ratings</span>
          </div>

          <div className="space-y-2">
            {stats.distribution && stats.distribution.map((item) => (
              <div key={item.stars || item.star} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-600 w-3">{item.stars || item.star}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-6 text-right">{item.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List Column */}
        <div className="w-full md:w-2/3 space-y-6">
          {isLoading ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {review.author.profilePicture ? (
                        <img src={review.author.profilePicture} alt={review.author.name} className="w-full h-full object-cover" />
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session:</span>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{review.session?.title || 'General Session'}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl">
              <p>No reviews yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = id ? `/profile/${id}` : '/profile/me';
      const response = await apiCall(endpoint);
      setProfile(response.user);
      setIsFollowing(response.user.isFollowing || false);
      setFollowersCount(response.user.followersCount || 0);
      setIsLiked(response.user.isLiked || false);
      setLikesCount(response.user.likesCount || 0);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiCall(`/social/follow/${profile.id}`, { method: 'DELETE' });
        setFollowersCount(prev => Math.max(0, prev - 1));
        setIsFollowing(false);
      } else {
        await apiCall(`/social/follow/${profile.id}`, { method: 'POST' });
        setFollowersCount(prev => prev + 1);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow action failed', err);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await apiCall(`/social/like/${profile.id}`, { method: 'DELETE' });
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await apiCall(`/social/like/${profile.id}`, { method: 'POST' });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Like action failed', err);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Enter edit mode: populate form
      setEditForm({
        name: profile.name || '',
        department: profile.department || '',
        yearOfStudy: profile.year || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        linkedinUrl: profile.linkedinUrl || '',
        mentorSkills: profile.mentorSkills ? profile.mentorSkills.join(', ') : ''
      });
      setPreviewImage(profile.profilePicture);
      setSelectedFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('department', editForm.department);
      formData.append('yearOfStudy', editForm.yearOfStudy);
      formData.append('bio', editForm.bio);
      formData.append('phone', editForm.phoneNumber);
      formData.append('linkedin', editForm.linkedinUrl);

      // Handle skills - split by comma and trim
      if (profile.role === 'MENTOR' && editForm.mentorSkills) {
        const skillsArray = editForm.mentorSkills.split(',').map(s => s.trim()).filter(s => s);
        formData.append('skills', JSON.stringify(skillsArray));
      }

      if (selectedFile) {
        formData.append('profileImage', selectedFile);
      }

      const response = await apiCall('/profile/update', {
        method: 'PUT',
        body: formData
      });

      setProfile(response.user);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found</div>;

  const isOwnProfile = !id || id === 'me'; // Simplified check, real app should compare with auth user id

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* HERO SECTION (Sticky Header) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <div className="p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
                <Share2 size={20} />
              </button>
              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleEditToggle}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        <X size={16} /> Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70"
                      >
                        {isSaving ? <span className="animate-spin">⏳</span> : <Save size={16} />} Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">

            {/* HEADER CARD */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${profile.role === "MENTOR" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                    {profile.role}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={editForm.department}
                      onChange={handleInputChange}
                      placeholder="Department"
                      className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold uppercase text-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    profile.department && (
                      <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                        <Briefcase size={12} /> {profile.department}
                      </span>
                    )
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight w-full bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {profile.name}
                  </h1>
                )}

                <div className="flex items-center gap-2 text-gray-500 mb-6">
                  <GraduationCap size={18} />
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span>Year</span>
                      <input
                        type="number"
                        name="yearOfStudy"
                        value={editForm.yearOfStudy}
                        onChange={handleInputChange}
                        className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                      <span>Student</span>
                    </div>
                  ) : (
                    profile.yearOfStudy && (
                      <span className="font-medium">Year {profile.yearOfStudy} Student</span>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 w-full md:w-auto">
                        <Linkedin size={18} className="text-blue-700" />
                        <input
                          type="text"
                          name="linkedinUrl"
                          value={editForm.linkedinUrl}
                          onChange={handleInputChange}
                          placeholder="LinkedIn URL"
                          className="font-medium text-sm w-full focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 w-full md:w-auto">
                        <Phone size={18} className="text-gray-400" />
                        <input
                          type="text"
                          name="phoneNumber"
                          value={editForm.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Phone Number"
                          className="font-medium text-sm w-full focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {profile.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                          <Linkedin size={18} />
                          <span className="font-medium text-sm">LinkedIn</span>
                        </a>
                      )}
                      {profile.phoneNumber && (
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                          <Phone size={18} className="text-gray-400" />
                          <span className="font-medium text-sm">{profile.phoneNumber}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ABOUT SECTION */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                About
              </h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 leading-relaxed text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed text-lg">
                  {profile.bio || "No bio available."}
                </p>
              )}
            </div>

            {/* SKILLS SECTION */}
            {(profile.role === 'MENTOR' || isEditing) && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Skills & Expertise
                </h3>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="mentorSkills"
                      value={editForm.mentorSkills}
                      onChange={handleInputChange}
                      placeholder="Enter skills separated by commas (e.g. React, Node.js, Design)"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-2 ml-1">Separate skills with commas</p>
                  </div>
                ) : (
                  profile.mentorSkills && profile.mentorSkills.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {profile.mentorSkills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-colors">
                          <CheckCircle size={14} className="text-green-500" />
                          {skill}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* REVIEWS SECTION (Only for Mentors) */}
            {profile.role === 'MENTOR' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <ReviewsSection userId={profile.id} />
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">

              {/* PROFILE IMAGE CARD */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 shadow-lg ring-4 ring-gray-50 relative group">
                  {isEditing ? (
                    <>
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl font-bold">
                          {profile.name?.charAt(0)}
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </>
                  ) : (
                    profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl font-bold">
                        {profile.name?.charAt(0)}
                      </div>
                    )
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                <p className="text-gray-500 font-medium mb-6">{profile.role === 'MENTOR' ? 'Mentor' : 'Learner'}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 mb-6">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{followersCount}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Followers</span>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <span className="block text-2xl font-bold text-gray-900">{likesCount}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Likes</span>
                  </div>
                </div>

                {/* ACTIONS (Inside Profile Card) */}
                {!isOwnProfile && (
                  <div className="space-y-3">
                    <button
                      onClick={handleFollow}
                      className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2
                                            ${isFollowing
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800 shadow-gray-400/20'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleLike}
                      className={`w-full py-3 rounded-xl font-bold text-base border-2 transition-all flex items-center justify-center gap-2
                                            ${isLiked
                          ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                          : 'bg-white border-gray-100 text-gray-900 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                      <Heart size={20} className={isLiked ? "fill-red-600" : ""} />
                      {isLiked ? 'Liked' : 'Like Profile'}
                    </button>
                  </div>
                )}
              </div>

              {/* EDUCATOR BADGE CARD (New) */}
              {profile.role === 'MENTOR' && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />

                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Educator Tiers</h3>
                      <p className="text-xs text-gray-500 font-medium">Unlock badges as you grow</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: "BRONZE EDUCATOR", count: "50+", color: "text-amber-700 bg-amber-50 border-amber-100" },
                      { name: "SILVER EDUCATOR", count: "150+", color: "text-gray-500 bg-gray-50 border-gray-200" },
                      { name: "GOLD EDUCATOR", count: "300+", color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
                      { name: "PLATINUM EDUCATOR", count: "500+", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
                      { name: "LEGEND EDUCATOR", count: "1000+", color: "text-purple-600 bg-purple-50 border-purple-100" },
                    ].map((tier, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${tier.color}`}>
                        <span className="text-xs font-bold tracking-wider">{tier.name}</span>
                        <span className="text-xs font-bold bg-white px-2 py-1 rounded-md shadow-sm">{tier.count} students</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
