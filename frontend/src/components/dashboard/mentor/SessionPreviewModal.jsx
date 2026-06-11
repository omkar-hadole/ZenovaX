import React from 'react';
import { ArrowLeft, X, Eye } from 'lucide-react';
import SessionPreviewContent from '../../common/SessionPreviewContent';

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
    availableSeats: formData.maxSeats,
    isBooked: false,
    status: 'UPCOMING',
    topics: formData.topics,
    mentor: {
      id: user?.id,
      name: user?.name,
      profilePicture: user?.profilePicture,
      department: user?.department,
      averageRating: null,
    },
  };

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
        <SessionPreviewContent session={session} isPreview />
      </div>
    </div>
  );
}
