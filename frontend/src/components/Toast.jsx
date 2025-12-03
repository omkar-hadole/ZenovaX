import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? Check : X;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${bgColor} text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur-md`}>
        <Icon className="w-5 h-5" />
        <span className="font-light">{message}</span>
      </div>
    </div>
  );
}