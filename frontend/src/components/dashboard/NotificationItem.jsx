import { Bell, CalendarCheck, Clock, PlayCircle, Radio, CheckCircle2, XCircle, Star, Trophy, Wallet, Ticket, FileQuestion, Code2, FileText, Megaphone, ArrowUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICON = {
  BOOKING_CONFIRMED: CalendarCheck,
  SESSION_REMINDER: Clock,
  SESSION_STARTING: PlayCircle,
  SESSION_LIVE: Radio,
  SESSION_COMPLETED: CheckCircle2,
  SESSION_CANCELLED: XCircle,
  NEW_REVIEW: Star,
  ACHIEVEMENT_UNLOCKED: Trophy,
  PAYMENT_SUCCESS: Wallet,
  SEAT_AVAILABLE: Ticket,
  QUIZ_LAUNCHED: FileQuestion,
  CODING_QUESTION_LAUNCHED: Code2,
  RESOURCE_UPLOADED: FileText,
  SESSION_REQUEST_APPROVED: CheckCircle2,
  SESSION_REQUEST_REJECTED: XCircle,
  LEARNING_REQUEST_SESSION_CREATED: ArrowUp,
  ADMIN_BROADCAST: Megaphone,
};

export default function NotificationItem({ notification, onClick }) {
  const Icon = TYPE_ICON[notification.type] || Bell;

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
          !notification.isRead ? 'bg-[#5a59b5]/[0.04] dark:bg-[#9190f8]/[0.06]' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-[#C9C7F5]/20 dark:bg-[#9190f8]/15 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-[#5a59b5] dark:text-[#9190f8]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {notification.title}
          </p>
          <p className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 ${notification.type === 'ADMIN_BROADCAST' ? '' : 'line-clamp-2'}`}>
            {notification.message}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        {!notification.isRead && (
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}
