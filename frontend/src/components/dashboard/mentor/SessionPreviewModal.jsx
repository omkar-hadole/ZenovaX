import React from 'react';
import {
  ArrowLeft, Calendar, Clock, Video, MapPin,
  CheckCircle, Star, Users, X, Eye
} from 'lucide-react';
import SessionPreviewContent from '../../common/SessionPreviewContent';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';

export default function SessionPreviewModal({ formData, user, onClose }) {
  const scheduledAt = formData.proposedDate && formData.time
    ? new Date(`${formData.proposedDate}T${formData.time}`)
    : new Date();

  const session = {
    title: formData.title,
    description: formData.description,
    mode: formData.mode,
    scheduledAt,
    duration: formData.duration,
    priceType: formData.priceType,
    price: formData.price,
    maxSeats: formData.maxSeats,
    topics: formData.topics,
    isBooked: false,
  };

  const sidebar = (
    <div className="sticky top-24 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
            {user?.profilePicture ? (
              <img
                src={getOptimizedImageUrl(user.profilePicture, { width: 112, height: 112 })}
                width={56}
                height={56}
                alt={user?.name || 'Mentor'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#A9C1F7]/20 text-[#5B8DEF] font-bold text-xl">
                {(user?.name || 'M')?.[0]}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{user?.name || 'Mentor Name'}</h4>
            <p className="text-xs text-gray-500 font-medium">{user?.department || 'Department'}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duration</span>
            <span className="font-bold text-gray-900">{formData.duration || 0} min</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Mode</span>
            <span className="font-bold text-gray-900">{formData.mode === 'ONLINE' ? 'Online' : 'In-Person'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Seats</span>
            <span className="font-bold text-gray-900">{formData.maxSeats || 0} max</span>
          </div>
          {formData.priceType === 'PAID' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-bold text-green-600">₹{formData.price || 0}</span>
            </div>
          )}
        </div>

        <button
          disabled
          className="w-full py-3.5 rounded-2xl font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
        >
          Register Now
        </button>
        <p className="text-xs text-center text-gray-400 mt-3">
          Preview only — this button is disabled
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#C9C7F5] to-[#A9C1F7] rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Star size={18} className="text-yellow-300 fill-yellow-300" />
          <span className="font-bold">Session Rating</span>
        </div>
        <p className="text-sm text-white/80 mb-1">No ratings yet</p>
        <p className="text-xs text-white/60">Ratings appear after the session</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          Participants
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-500">0/{formData.maxSeats || 0}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Seats fill up after launch</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FC] overflow-y-auto">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <div className="p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium">Back to Editor</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
              <Eye size={14} />
              PREVIEW MODE
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SessionPreviewContent
          session={session}
          isPreview
          sidebar={sidebar}
        />
      </div>
    </div>
  );
}
