import { useState, useEffect, useRef } from 'react';
import { Lock, Award, CheckCircle } from 'lucide-react';

const ALL_BADGES = [
  { name: "First Step",     category: "Sessions",   fileName: "Fisrt_Step",    desc: "Completed their first mentoring session",                      requirement: "Complete 1 mentoring session",                 target: 1,    getProgress: (s) => s.totalSessions ?? 0 },
  { name: "Session Pro",    category: "Sessions",   fileName: "Session_Pro",   desc: "Completed 5+ mentoring sessions",                              requirement: "Complete 5 mentoring sessions",                 target: 5,    getProgress: (s) => s.totalSessions ?? 0 },
  { name: "Veteran",        category: "Sessions",   fileName: "Veteran",       desc: "Completed 10+ mentoring sessions",                             requirement: "Complete 10 mentoring sessions",                target: 10,   getProgress: (s) => s.totalSessions ?? 0 },
  { name: "Elite Mentor",   category: "Sessions",   fileName: "Elite_Mentor",  desc: "Completed 25+ mentoring sessions",                             requirement: "Complete 25 mentoring sessions",                target: 25,   getProgress: (s) => s.totalSessions ?? 0 },
  { name: "Master Mentor",  category: "Sessions",   fileName: "Master_Mentor", desc: "Completed 50+ mentoring sessions",                             requirement: "Complete 50 mentoring sessions",                target: 50,   getProgress: (s) => s.totalSessions ?? 0 },

  { name: "Guide",          category: "Learners",   fileName: "Guide",         desc: "Helped 10+ unique learners",                                  requirement: "Help 10 unique learners",                      target: 10,   getProgress: (s) => s.uniqueLearners ?? 0 },
  { name: "Pathfinder",     category: "Learners",   fileName: "Path_Finder",   desc: "Helped 50+ unique learners",                                  requirement: "Help 50 unique learners",                      target: 50,   getProgress: (s) => s.uniqueLearners ?? 0 },
  { name: "Game Changer",   category: "Learners",   fileName: "Game_Changer",  desc: "Helped 100+ unique learners",                                 requirement: "Help 100 unique learners",                     target: 100,  getProgress: (s) => s.uniqueLearners ?? 0 },
  { name: "Impact Maker",   category: "Learners",   fileName: "Impact_Maker",  desc: "Helped 250+ unique learners",                                 requirement: "Help 250 unique learners",                     target: 250,  getProgress: (s) => s.uniqueLearners ?? 0 },

  { name: "Well Rated",     category: "Ratings",    fileName: "Well_Rated",    desc: "Maintained a 4.0+ average rating",                             requirement: "Reach 4.0 average rating",                     target: 4.0,  getProgress: (s) => s.averageRating ?? 0 },
  { name: "Top Rated",      category: "Ratings",    fileName: "Top_Rated",     desc: "Maintained a 4.5+ average rating",                             requirement: "Reach 4.5 average rating",                     target: 4.5,  getProgress: (s) => s.averageRating ?? 0 },
  { name: "Exceptional",    category: "Ratings",    fileName: "Exceptional",   desc: "Maintained a 4.8+ rating with 20+ reviews",                    requirement: "Reach 4.8 average rating with 20+ reviews",     target: 4.8,  getProgress: (s) => s.averageRating ?? 0, extraRequirement: (s) => (s.totalReviews ?? 0) >= 20 },

  { name: "Loved",          category: "Social",     fileName: "Loved",         desc: "Received 50+ likes",                                          requirement: "Receive 50 likes on your profile",              target: 50,   getProgress: (s) => s.likesCount ?? 0 },
  { name: "Popular",        category: "Social",     fileName: "Popular",       desc: "Accumulated 50+ followers",                                    requirement: "Accumulate 50 followers",                      target: 50,   getProgress: (s) => s.followersCount ?? 0 },
  { name: "Favorite",       category: "Social",     fileName: "Favorite",      desc: "Reached 25+ followers and 50+ likes",                          requirement: "Reach 25 followers and 50 likes",              target: 25,   getProgress: (s) => Math.min(s.followersCount ?? 0, s.likesCount ?? 0), extraRequirement: (s) => (s.followersCount ?? 0) >= 25 && (s.likesCount ?? 0) >= 50 },
];

const badgeModules = import.meta.glob('../../assets/Badges/*.webp', { eager: true });
const badgeUrlCache = {};
for (const [path, mod] of Object.entries(badgeModules)) {
  const fileName = path.split('/').pop().replace('.webp', '');
  badgeUrlCache[fileName] = mod.default;
}

export default function AchievementGallery({ stats = {}, earnedBadges = [] }) {
  const earnedSet = useRef(new Set(earnedBadges));
  const [justUnlocked, setJustUnlocked] = useState(new Set());

  useEffect(() => {
    const prev = earnedSet.current;
    const next = new Set(earnedBadges);
    const newly = [];
    for (const b of next) {
      if (!prev.has(b)) newly.push(b);
    }
    if (newly.length > 0) {
      setJustUnlocked(new Set(newly));
      setTimeout(() => setJustUnlocked(new Set()), 500);
    }
    earnedSet.current = next;
  }, [earnedBadges]);

  const isUnlocked = (badge) => {
    const base = badge.getProgress(stats) >= badge.target;
    if (badge.extraRequirement) return base && badge.extraRequirement(stats);
    return base;
  };

  const progressPercent = (badge) => {
    const current = badge.getProgress(stats);
    if (badge.name === "Favorite") {
      const f = stats.followersCount ?? 0;
      const l = stats.likesCount ?? 0;
      const avg = (Math.min(f, l) / 25) * 100;
      return Math.min(100, Math.round(avg));
    }
    if (badge.category === "Ratings") {
      return Math.min(100, Math.round((current / badge.target) * 100));
    }
    return Math.min(100, Math.round((current / badge.target) * 100));
  };

  const progressText = (badge) => {
    const current = badge.getProgress(stats);
    if (badge.name === "Exceptional") {
      return `Rating: ${current.toFixed(1)} / ${badge.target}  |  Reviews: ${stats.totalReviews ?? 0} / 20`;
    }
    if (badge.name === "Favorite") {
      return `Followers: ${stats.followersCount ?? 0} / 25  |  Likes: ${stats.likesCount ?? 0} / 50`;
    }
    if (badge.category === "Ratings") {
      return `${current.toFixed(1)} / ${badge.target}`;
    }
    return `${Math.min(current, badge.target)} / ${badge.target}`;
  };

  const sorted = [...ALL_BADGES].sort((a, b) => {
    const aUnlocked = isUnlocked(a);
    const bUnlocked = isUnlocked(b);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Award className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        Achievements
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 ml-2">
          ({earnedBadges.length} / {ALL_BADGES.length})
        </span>
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {sorted.map((badge) => {
              const unlocked = isUnlocked(badge);
              const animating = justUnlocked.has(badge.name);
              const imgUrl = badgeUrlCache[badge.fileName];

              return (
                <div
                  key={badge.name}
                  className="group relative"
                >
                  <div
                    className={`relative flex flex-col items-center text-center transition-all duration-500 ${
                      unlocked ? '' : 'cursor-pointer'
                    }
                    ${animating ? 'scale-105' : ''}`}
                  >
                    {!unlocked && (
                      <div className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-gray-400/50 dark:bg-gray-600/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {unlocked && animating && (
                      <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 animate-pulse pointer-events-none" />
                    )}

                    <div className={`relative transition-all duration-500 ${
                      unlocked
                        ? animating
                          ? 'scale-110'
                          : 'group-hover:scale-110'
                        : 'grayscale opacity-55 group-hover:opacity-70'
                    }`}>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          width={80}
                          height={80}
                          alt={badge.name}
                          className="w-20 h-20 object-contain drop-shadow-sm transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Tooltip on hover for locked */}
                  {!unlocked && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-neutral-100 text-white dark:text-gray-950 text-xs rounded-xl py-3 px-3.5 shadow-xl border border-black/10 dark:border-white/10 text-left space-y-2">
                        <div className="font-bold text-sm">{badge.name}</div>
                        <div className="text-gray-300 dark:text-gray-600 leading-relaxed">
                          {badge.requirement}
                        </div>
                        <div>
                          <div className="w-full h-1.5 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all"
                              style={{ width: `${Math.min(100, progressPercent(badge))}%` }}
                            />
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-[10px] font-mono mt-1">
                            {progressText(badge)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tooltip on hover for unlocked */}
                  {unlocked && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-neutral-100 text-white dark:text-gray-950 text-xs rounded-xl py-2.5 px-3.5 shadow-xl border border-black/10 dark:border-white/10 text-center">
                        <div className="font-bold mb-1 border-b border-white/10 dark:border-black/10 pb-1">{badge.name}</div>
                        <div className="text-gray-300 dark:text-gray-600 leading-snug font-medium">
                          {badge.desc}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unlocked checkmark */}
                  {unlocked && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

      {ALL_BADGES.length === 0 && (
        <div className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
          No achievements available.
        </div>
      )}
    </div>
  );
}
