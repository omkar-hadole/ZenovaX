import { useEffect } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "danger" 
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const Icon = isDanger ? AlertTriangle : HelpCircle;
  const confirmBtnBg = isDanger 
    ? 'bg-red-400 hover:bg-red-500 focus:ring-red-500/30' 
    : 'bg-[#7A79E6] hover:bg-[#6c6bd6] focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onCancel} 
      />
      
      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-zoom-in">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isDanger ? 'bg-red-50 dark:bg-red-950/35 text-red-500' : 'bg-indigo-50 dark:bg-indigo-950/35 text-[#7A79E6]'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors focus:ring-4 cursor-pointer ${confirmBtnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
