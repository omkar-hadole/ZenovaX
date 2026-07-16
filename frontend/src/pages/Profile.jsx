import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  CheckCircle,
  FileText,
  Star,
  Briefcase,
  Linkedin,
  Phone,
  Edit2,
  Award,
  Camera,
  Save,
  X,
  GraduationCap
} from 'lucide-react';
import { apiCall } from '../utils/api';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';
import Toast from '../components/Toast';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import ThemeToggle from '../components/ThemeToggle';

const PREDEFINED_AVATARS = [
  '/avatars/Boy_1.png',
  '/avatars/Boy_2.png',
  '/avatars/Boy_3.png',
  '/avatars/Girl_1.png',
  '/avatars/Girl_2.png',
  '/avatars/Girl_3.png',
];

const BADGE_FILE_NAMES = {
  "First Step": "Fisrt_Step",
  "Session Pro": "Session_Pro",
  "Veteran": "Veteran",
  "Elite Mentor": "Elite_Mentor",
  "Master Mentor": "Master_Mentor",
  "Guide": "Guide",
  "Pathfinder": "Path_Finder",
  "Game Changer": "Game_Changer",
  "Impact Maker": "Impact_Maker",
  "Well Rated": "Well_Rated",
  "Top Rated": "Top_Rated",
  "Exceptional": "Exceptional",
  "Loved": "Loved",
  "Popular": "Popular",
  "Favorite": "Favorite"
};

const BADGE_INFO = {
  "First Step": { description: "Completed their first mentoring session" },
  "Session Pro": { description: "Completed 5+ mentoring sessions" },
  "Veteran": { description: "Completed 10+ mentoring sessions" },
  "Elite Mentor": { description: "Completed 25+ mentoring sessions" },
  "Master Mentor": { description: "Completed 50+ mentoring sessions" },
  "Guide": { description: "Helped 10+ unique learners" },
  "Pathfinder": { description: "Helped 50+ unique learners" },
  "Game Changer": { description: "Helped 100+ unique learners" },
  "Impact Maker": { description: "Helped 250+ unique learners" },
  "Well Rated": { description: "Maintained a 4.0+ average rating" },
  "Top Rated": { description: "Maintained a 4.5+ average rating" },
  "Exceptional": { description: "Maintained a 4.8+ rating with 20+ reviews" },
  "Loved": { description: "Received 50+ likes" },
  "Popular": { description: "Accumulated 50+ followers" },
  "Favorite": { description: "Reached 25+ followers and 50+ likes" }
};

const ReviewsSection = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, distribution: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const data = await apiCall(`/reviews/mentor/${userId}`);
      const fetchedReviews = data.reviews || [];
      setReviews(fetchedReviews);

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
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Student Reviews</h4>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-800/60 p-6 rounded-2xl h-fit">
          <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">{stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}</span>
            <div className="flex gap-1 my-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(stats.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stats.totalReviews} ratings</span>
          </div>

          <div className="space-y-2">
            {stats.distribution && stats.distribution.map((item) => (
              <div key={item.stars || item.star} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-300 w-3">{item.stars || item.star}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 dark:text-gray-500 w-6 text-right">{item.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session:</span>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{review.session?.title || 'General Session'}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
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
  const [badgeImages, setBadgeImages] = useState({});
  const [toast, setToast] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile && profile.role === 'MENTOR' && profile.badges && profile.badges.length > 0) {
      const loadBadgeImages = async () => {
        const loaded = {};
        for (const badgeName of profile.badges) {
          try {
            const fileName = BADGE_FILE_NAMES[badgeName];
            if (fileName) {
              const module = await import(`../assets/Badges/${fileName}.webp`);
              loaded[badgeName] = module.default;
            }
          } catch (err) {
            console.error(`Failed to load badge image for ${badgeName}`, err);
          }
        }
        setBadgeImages(loaded);
      };
      loadBadgeImages();
    }
  }, [profile]);

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
    const prevIsFollowing = isFollowing;
    const prevFollowersCount = followersCount;

    const nextIsFollowing = !prevIsFollowing;
    const nextFollowersCount = nextIsFollowing
      ? prevFollowersCount + 1
      : Math.max(0, prevFollowersCount - 1);

    setIsFollowing(nextIsFollowing);
    setFollowersCount(nextFollowersCount);

    try {
      if (prevIsFollowing) {
        await apiCall(`/social/follow/${profile.id}`, { method: 'DELETE' });
      } else {
        await apiCall(`/social/follow/${profile.id}`, { method: 'POST' });
      }
    } catch (err) {
      console.error('Follow action failed', err);
      setIsFollowing(prevIsFollowing);
      setFollowersCount(prevFollowersCount);
      setToast({ message: err.message || 'Follow action failed. Please try again.', type: 'error' });
    }
  };

  const handleLike = async () => {
    const prevIsLiked = isLiked;
    const prevLikesCount = likesCount;

    const nextIsLiked = !prevIsLiked;
    const nextLikesCount = nextIsLiked
      ? prevLikesCount + 1
      : Math.max(0, prevLikesCount - 1);

    setIsLiked(nextIsLiked);
    setLikesCount(nextLikesCount);

    try {
      if (prevIsLiked) {
        await apiCall(`/social/like/${profile.id}`, { method: 'DELETE' });
      } else {
        await apiCall(`/social/like/${profile.id}`, { method: 'POST' });
      }
    } catch (err) {
      console.error('Like action failed', err);
      setIsLiked(prevIsLiked);
      setLikesCount(prevLikesCount);
      setToast({ message: err.message || 'Like action failed. Please try again.', type: 'error' });
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditForm({
        name: profile.name || '',
        department: profile.department || '',
        yearOfStudy: profile.year || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        linkedinUrl: profile.linkedinUrl || '',
        isPhoneVisible: profile.isPhoneVisible !== undefined ? profile.isPhoneVisible : true,
        mentorSkills: profile.mentorSkills ? profile.mentorSkills.join(', ') : ''
      });
      setPreviewImage(profile.profilePicture);
      setSelectedFile(null);
      setSelectedAvatar(null);
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
      setSelectedAvatar(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPredefinedAvatar = (avatarUrl) => {
    setPreviewImage(avatarUrl);
    setSelectedFile(null);
    setSelectedAvatar(avatarUrl);
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
      formData.append('isPhoneVisible', editForm.isPhoneVisible);

      if (profile.role === 'MENTOR' && editForm.mentorSkills) {
        const skillsArray = editForm.mentorSkills.split(',').map(s => s.trim()).filter(s => s);
        formData.append('skills', JSON.stringify(skillsArray));
      }

      if (selectedFile) {
        formData.append('profileImage', selectedFile);
      } else if (selectedAvatar) {
        formData.append('profilePicture', selectedAvatar);
      }

      const response = await apiCall('/profile/update', {
        method: 'PUT',
        body: formData
      });

      setProfile(response.user);
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to update profile", error);
      setToast({ message: "Failed to update profile: " + error.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="p-8 text-center text-red-500 dark:text-red-400">Profile not found</div>;

  const isOwnProfile = !id || id === 'me';

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 [transform:translateZ(0)] [will-change:transform]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
            >
              <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleEditToggle}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

          <div className="lg:col-span-8 space-y-8">

            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${profile.role === "MENTOR" ? "bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" : "bg-green-50 text-green-600 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"}`}>
                    {profile.role}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={editForm.department}
                      onChange={handleInputChange}
                      placeholder="Department"
                      className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold uppercase text-gray-600 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    profile.department && (
                      <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
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
                    className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                    {profile.name}
                  </h1>
                )}

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span>Year</span>
                      <input
                        type="number"
                        name="yearOfStudy"
                        value={editForm.yearOfStudy}
                        onChange={handleInputChange}
                        className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                      <span>Student</span>
                    </div>
                  ) : (
                    profile.yearOfStudy && (
                      <span className="font-medium">Year {profile.yearOfStudy} Student</span>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                        <Linkedin size={18} className="text-blue-700 dark:text-blue-400" />
                        <input
                          type="text"
                          name="linkedinUrl"
                          value={editForm.linkedinUrl}
                          onChange={handleInputChange}
                          placeholder="LinkedIn URL"
                          className="font-medium text-sm w-full focus:outline-none dark:bg-transparent dark:text-gray-100"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                        <Phone size={18} className="text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          name="phoneNumber"
                          value={editForm.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Phone Number"
                          className="font-medium text-sm w-full focus:outline-none dark:bg-transparent dark:text-gray-100"
                        />
                      </div>
                      {profile.role === 'MENTOR' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name="isPhoneVisible"
                            id="isPhoneVisible"
                            checked={editForm.isPhoneVisible}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isPhoneVisible: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="isPhoneVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Show Phone Number to Learners
                          </label>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {profile.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 transition-colors">
                          <Linkedin size={18} />
                          <span className="font-medium text-sm">LinkedIn</span>
                        </a>
                      )}
                      {profile.phoneNumber && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                          <Phone size={18} className="text-gray-400 dark:text-gray-500" />
                          <span className="font-medium text-sm">{profile.phoneNumber}</span>
                        </div>
                      )}
                      {profile.year && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                          <GraduationCap size={18} className="text-gray-400 dark:text-gray-500" />
                          <span className="font-medium text-sm">Year {profile.year}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                About
              </h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 leading-relaxed text-lg focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {profile.bio || "No bio available."}
                </p>
              )}
            </div>

            {(profile.role === 'MENTOR' || isEditing) && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-1">Separate skills with commas</p>
                  </div>
                ) : (
                  profile.mentorSkills && profile.mentorSkills.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {profile.mentorSkills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 dark:hover:border-indigo-500/20 transition-colors">
                          <CheckCircle size={14} className="text-green-500 dark:text-green-400" />
                          {skill}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {profile.role === 'MENTOR' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <ReviewsSection userId={profile.id} />
              </div>
            )}

          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">

              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 shadow-lg ring-4 ring-gray-50 dark:ring-gray-800 relative group">
                  {isEditing ? (
                    <>
                      {previewImage ? (
                        <img
                          src={getOptimizedImageUrl(previewImage, { width: 256, height: 256 })}
                          width={128}
                          height={128}
                          loading="lazy"
                          alt="Profile picture preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-4xl font-bold">
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
                      <img
                        src={getOptimizedImageUrl(profile.profilePicture, { width: 256, height: 256 })}
                        width={128}
                        height={128}
                        fetchPriority="high"
                        alt={profile.name || "User profile picture"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-4xl font-bold">
                        {profile.name?.charAt(0)}
                      </div>
                    )
                  )}
                </div>
                {isEditing && profile.role === 'LEARNER' && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-2 uppercase tracking-wider">Or Choose Predefined Avatar</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {PREDEFINED_AVATARS.map((avatar, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPredefinedAvatar(avatar)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${previewImage === avatar
                              ? 'border-indigo-600 scale-105 ring-2 ring-indigo-100 dark:ring-indigo-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                            }`}
                        >
                          <img src={avatar} className="w-full h-full object-cover" alt={`Avatar ${idx}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{profile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">{profile.role === 'MENTOR' ? 'Mentor' : 'Learner'}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6 mb-6">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-gray-100">{followersCount}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Followers</span>
                  </div>
                  <div className="text-center border-l border-gray-100 dark:border-gray-800">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-gray-100">{likesCount}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Likes</span>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="space-y-3">
                    <button
                      onClick={handleFollow}
                      className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all transform hover:-translate-y-1
                                            ${isFollowing
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-gray-400/20 dark:shadow-none'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleLike}
                      className={`w-full py-3 rounded-xl font-bold text-base border-2 transition-all flex items-center justify-center gap-2
                                            ${isLiked
                          ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20'
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <Heart size={20} className={isLiked ? "fill-red-600" : ""} />
                      {isLiked ? 'Liked' : 'Like Profile'}
                    </button>
                  </div>
                )}
              </div>

              {profile.role === 'MENTOR' && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    Achievements
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    {profile.badges && profile.badges.length > 0 ? (
                      profile.badges.map((badgeName, i) => (
                        <div key={i} className="group relative">
                          {/* Badge Image */}
                          <div className="w-22 h-22 transition-transform hover:scale-110 cursor-pointer">
                            {badgeImages[badgeName] ? (
                              <img
                                src={badgeImages[badgeName]}
                                width={88}
                                height={88}
                                loading="lazy"
                                alt={badgeName || "Achievement badge icon"}
                                className="w-full h-full object-contain drop-shadow-sm"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                            )}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl relative text-center">
                              <div className="font-bold mb-1 border-b border-gray-700 pb-1">{badgeName}</div>
                              <div className="text-gray-300 leading-snug">
                                {BADGE_INFO[badgeName]?.description || "Achievement unlocked!"}
                              </div>
                              {/* Tooltip Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        No badges unlocked yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
