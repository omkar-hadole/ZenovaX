import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, CheckCircle, FileText, Users, Star, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { cleanDescription } from '../../utils/descriptionFormatter';
import QRCodeGenerator from './QRCodeGenerator';
import AddToCalendarButton from './AddToCalendarButton';

function parseTopics(topics) {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics;
  if (typeof topics === 'string') {
    try {
      const parsed = JSON.parse(topics);
      if (Array.isArray(parsed)) return parsed;
    } catch {
    }
    return topics.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

export default function SessionPreviewContent({ session, isPreview, children, onRegister, isRegistering, onReport, userRole, userId }) {
  const navigate = useNavigate();
  const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
  const topics = parseTopics(session.topics);
  const isSessionTimeOver = new Date(new Date(session.scheduledAt).getTime() + session.duration * 60000) < new Date();
  const isHost = session.mentorId === userId || session.mentor?.id === userId;
  const now = new Date();
  const fifteenMinsBeforeStart = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
  const isLinkActive = now >= fifteenMinsBeforeStart;
  const bookingId = session.bookingId || (session.bookings && session.bookings.length > 0 ? session.bookings[0].id : null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                session.mode === 'ONLINE'
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'
                  : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20'
              }`}>
                {session.mode} Session
              </span>
              {isPreview && (
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-full text-xs font-bold uppercase">
                  Preview
                </span>
              )}
              {!isPreview && session.isBooked && (
                <span className="px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle size={12} /> Enrolled
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
              {session.title || 'Session Title'}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar className="text-indigo-500 dark:text-indigo-400" size={18} />
                <span className="font-medium text-sm">
                  {scheduledAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <Clock className="text-purple-500 dark:text-purple-400" size={18} />
                <span className="font-medium text-sm">
                  {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} • {session.duration || 0} min
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            About this Session
          </h3>
          <div className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold">
            <Markdown remarkPlugins={[remarkBreaks]}>{cleanDescription(session.description || '')}</Markdown>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            What You'll Learn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.length > 0 ? topics.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle size={12} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t}</span>
              </div>
            )) : (
              <div className="text-gray-500 dark:text-gray-400">No topics listed</div>
            )}
          </div>
        </div>

        {children}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Instructor</h3>
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-500/20">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{session.mentor?.averageRating ? session.mentor.averageRating.toFixed(1) : 'N/A'}</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-4 ring-gray-50 dark:ring-gray-800">
                {session.mentor?.profilePicture ? (
                  <img
                    src={getOptimizedImageUrl(session.mentor.profilePicture, { width: 192, height: 192 })}
                    width={96}
                    height={96}
                    loading="lazy"
                    alt={session.mentor.name || "Mentor profile picture"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#A9C1F7]/20 text-[#5B8DEF] font-bold text-3xl">
                    {(session.mentor?.name || 'M')?.[0]}
                  </div>
                )}
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{session.mentor?.name || 'Mentor Name'}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{session.mentor?.department || 'Department'}</p>
            </div>

            {session.mentor?.id && (
              <button
                onClick={() => navigate(`/profile/${session.mentor.id}`)}
                className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center justify-center gap-2"
              >
                View Profile
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-white/50 dark:border-gray-800">
            <div className="mb-8">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Registration Fee</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  {session.priceType === 'FREE' ? 'Free' : `₹${session.price}`}
                </span>
                {session.priceType === 'PAID' && <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">per person</span>}
              </div>
            </div>

            <div className="space-y-5 mb-8 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium"><Users className="w-4 h-4" /> Seats Available</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{session.availableSeats} <span className="text-gray-400 dark:text-gray-500 font-normal">/ {session.maxSeats}</span></span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${session.maxSeats > 0 ? ((session.maxSeats - session.availableSeats) / session.maxSeats) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-medium">
                {session.availableSeats < 5 ? '🔥 Selling out fast!' : 'Book your spot now'}
              </p>
            </div>

            {isPreview ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl font-bold text-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              >
                Register Now
              </button>
            ) : session.isBooked ? (
              <div className="space-y-4">
                <button
                  disabled
                  className="w-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  <CheckCircle className="w-5 h-5" />
                  Registered
                </button>

                {session.status === 'COMPLETED' || isSessionTimeOver ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Session Completed
                  </button>
                ) : session.mode === 'OFFLINE' ? (
                  bookingId ? (
                    <div className="mt-4">
                      <QRCodeGenerator bookingId={bookingId} sessionId={session.id} />
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      In-Person Session
                    </div>
                  )
                ) : isLinkActive ? (
                  <button
                    onClick={() => window.open(`/session/${session.id}/live`, '_blank')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 dark:shadow-none dark:hover:shadow-none flex items-center justify-center gap-2.5 animate-pulse"
                  >
                    <Video className="w-5 h-5" />
                    Join Live Class
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                    title="Live class link activates 15 minutes before the session starts"
                  >
                    <Video className="w-5 h-5" />
                    Starts Soon
                  </button>
                )}

                {!(session.status === 'COMPLETED' || isSessionTimeOver) && (
                  <AddToCalendarButton session={session} />
                )}
              </div>
            ) : isHost ? (
              <div className="space-y-4">
                {session.status === 'COMPLETED' || isSessionTimeOver ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Session Completed
                  </button>
                ) : session.mode === 'OFFLINE' ? (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    In-Person Session (Host)
                  </div>
                ) : isLinkActive ? (
                  <button
                    onClick={() => window.open(`/session/${session.id}/live`, '_blank')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 dark:shadow-none dark:hover:shadow-none flex items-center justify-center gap-2.5 animate-pulse"
                  >
                    <Video className="w-5 h-5" />
                    Join Live Class (Host)
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
                    title="Live class link activates 15 minutes before the session starts"
                  >
                    <Video className="w-5 h-5" />
                    Starts Soon
                  </button>
                )}

                {!(session.status === 'COMPLETED' || isSessionTimeOver) && (
                  <AddToCalendarButton session={session} />
                )}
              </div>
            ) : userRole === 'MENTOR' ? (
              <button
                disabled
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                Register Now (Disabled for Mentors)
              </button>
            ) : isSessionTimeOver ? (
              <button
                disabled
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                Registration Closed
              </button>
            ) : (
              <button
                onClick={onRegister}
                disabled={session.availableSeats === 0 || isRegistering}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1
                    ${session.availableSeats === 0
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 hover:shadow-2xl shadow-gray-400/20 dark:shadow-none'}`}
              >
                {session.availableSeats === 0 ? 'Full' : isRegistering ? 'Registering...' : 'Register Now'}
              </button>
            )}

            {!isPreview && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <button
                  onClick={onReport}
                  className="text-gray-400 dark:text-gray-500 text-xs font-bold hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wider group"
                >
                  <AlertTriangle className="w-3.5 h-3.5 group-hover:animate-bounce" />
                  Report an issue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
