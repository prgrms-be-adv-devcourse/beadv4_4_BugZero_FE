import { useEffect, useState, useRef } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import NotificationItem from './NotificationItem';


interface NotificationDropdownProps {
    onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const { notifications, fetchNotifications, markAsRead, isLoading } = useNotificationStore();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        fetchNotifications(0, 20, filter === 'UNREAD');
    }, [filter, fetchNotifications]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleRead = async (id: number) => {
        await markAsRead(id);
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-96 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[600px]"
        >
            <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
                <h3 className="font-bold text-white">알림</h3>
                <div className="flex bg-[#1a1a1a] rounded-lg p-1">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === 'ALL'
                            ? 'bg-zinc-700 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setFilter('UNREAD')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === 'UNREAD'
                            ? 'bg-yellow-500 text-black font-bold'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        안읽음
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {isLoading && notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                        로딩중...
                    </div>
                ) : notifications.length > 0 ? (
                    <div>
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={handleRead}
                            />
                        ))}
                        {/* Simple Load More trigger could be added here, 
                             for now just showing verified 20 items. 
                             If we need more we can add pagination. */}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-30">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        <p>알림이 없습니다.</p>
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-[#1a1a1a] bg-[#0f0f0f] text-center">
                {/* Optional footer actions */}
            </div>
        </div>
    );
}
