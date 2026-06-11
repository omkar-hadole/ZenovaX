import React from 'react';
import { Calendar, Clock, Video, MapPin, CheckCircle, FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

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

export default function SessionPreviewContent({ session, isPreview, children, sidebar }) {
  const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
  const topics = parseTopics(session.topics);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                session.mode === 'ONLINE'
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  : 'bg-orange-50 text-orange-600 border border-orange-100'
              }`}>
                {session.mode === 'ONLINE' ? (
                  <span className="flex items-center gap-1"><Video size={12} /> Online</span>
                ) : (
                  <span className="flex items-center gap-1"><MapPin size={12} /> In-Person</span>
                )}
              </span>
              {isPreview && (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-xs font-bold uppercase">
                  Preview
                </span>
              )}
              {!isPreview && session.isBooked && (
                <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle size={12} /> Enrolled
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {session.title || 'Session Title'}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              {!isNaN(scheduledAt.getTime()) && (
                <>
                  <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <Calendar className="text-indigo-500" size={18} />
                    <span className="font-medium text-sm">
                      {scheduledAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <Clock className="text-purple-500" size={18} />
                    <span className="font-medium text-sm">
                      {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.duration || 0} min
                    </span>
                  </div>
                </>
              )}
              {session.priceType === 'PAID' && (
                <div className="flex items-center gap-2.5 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                  <span className="font-bold text-green-700">₹{session.price || 0}</span>
                </div>
              )}
              {session.priceType === 'FREE' && (
                <div className="flex items-center gap-2.5 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                  <span className="font-bold text-green-700">Free</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            About this Session
          </h3>
          <div className="text-gray-600 leading-relaxed text-lg prose prose-gray max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0">
            <Markdown remarkPlugins={[remarkBreaks]}>{session.description || '_No description provided yet.'}</Markdown>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-400" />
            What You'll Learn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.length > 0 ? topics.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle size={12} className="text-green-600" />
                </div>
                <span className="font-medium text-gray-700">{t}</span>
              </div>
            )) : (
              <div className="text-gray-500">No topics listed</div>
            )}
          </div>
        </div>

        {children}
      </div>

      {sidebar && (
        <div className="lg:col-span-4">
          {sidebar}
        </div>
      )}
    </div>
  );
}
