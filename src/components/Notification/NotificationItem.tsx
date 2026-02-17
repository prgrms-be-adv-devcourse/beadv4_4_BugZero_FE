import { Notification } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: number) => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const isRead = notification.isRead;

    // Format date safely
    const timeAgo = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ko })
        : '';

    const Content = (
        <div className={`p-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors relative group ${!isRead ? 'bg-[#0f0f0f]' : ''}`}>
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    {notification.title && (
                        <p className={`text-sm font-semibold mb-1 ${!isRead ? 'text-white' : 'text-gray-400'}`}>
                            {notification.title}
                        </p>
                    )}
                    <p className={`text-sm ${!isRead ? 'text-gray-200' : 'text-gray-500'} break-words whitespace-pre-wrap`}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">{timeAgo}</p>
                </div>

                {/* Visual indicator for unread */}
                {!isRead && (
                    <div className="shrink-0 flex flex-col items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 mb-2"></div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                notification.id && onRead(notification.id);
                            }}
                            className="text-gray-500 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                            title="읽음 처리"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (notification.link) {
        return (
            <Link
                href={notification.link}
                onClick={() => notification.id && !isRead && onRead(notification.id)}
                className="block"
            >
                {Content}
            </Link>
        );
    }

    return (
        <div onClick={() => notification.id && !isRead && onRead(notification.id)} className="cursor-pointer">
            {Content}
        </div>
    );
}
