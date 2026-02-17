import { create } from 'zustand';
import { api, Notification } from '@/lib/api';
import toast from 'react-hot-toast';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from './useAuthStore';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    abortController: AbortController | null;
    isLoading: boolean;

    connect: () => void;
    disconnect: () => void;
    fetchNotifications: (page?: number, size?: number, onlyUnread?: boolean) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>; // Future proofing
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    abortController: null,
    isLoading: false,

    connect: async () => {
        const { abortController, disconnect } = get();
        if (abortController) return; // Already connected

        if (typeof window === 'undefined') return;

        const token = useAuthStore.getState().accessToken;
        if (!token) {
            console.warn('Cannot connect to SSE without access token');
            return;
        }

        const controller = new AbortController();
        set({ abortController: controller });

        try {
            const url = api.getNotificationSubscribeUrl();

            await fetchEventSource(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/event-stream',
                },
                signal: controller.signal,
                openWhenHidden: true, // Keep connection open when tab is backgrounded
                onopen: async (response) => {
                    if (response.ok) {
                        console.log('SSE Connected');
                        set({ isConnected: true });
                        get().fetchUnreadCount();
                    } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        // Client error, usually 401/403. Do not retry.
                        // disconnect(); 
                        throw new Error(`Failed to connect to SSE: ${response.status} ${response.statusText}`);
                    }
                },
                onmessage: (event) => {
                    // console.log(`SSE Event: ${event.event}, Data: ${event.data}`);

                    if (event.event === 'connect' || event.event === 'connected') {
                        console.log('SSE Connected Event received:', event.data);
                        return;
                    }

                    if (event.event === 'notification') {
                        try {
                            const data = JSON.parse(event.data);
                            get().addNotification(data);

                            toast(data.message || '새로운 알림이 도착했습니다.', {
                                icon: '🔔',
                                duration: 4000,
                                position: 'top-right',
                            });
                        } catch (error) {
                            console.error('Failed to parse SSE message', error);
                        }
                    }
                },
                onerror: (err) => {
                    console.error('SSE Error', err);
                    // fetch-event-source retries automatically unless we throw
                    // If we want to stop retrying on critical errors, we can throw here.
                    set({ isConnected: false });
                },
                onclose: () => {
                    console.log('SSE Closed');
                    set({ isConnected: false, abortController: null });
                }
            });

        } catch (error) {
            console.error('Failed to initiate SSE', error);
            set({ isConnected: false, abortController: null });
        }
    },

    disconnect: () => {
        const { abortController } = get();
        if (abortController) {
            abortController.abort();
            set({ abortController: null, isConnected: false });
        }
    },

    fetchNotifications: async (page = 0, size = 10, onlyUnread = false) => {
        set({ isLoading: true });
        try {
            const response = await api.getNotifications(onlyUnread, { page, size });
            set({ notifications: response.data || [], isLoading: false });
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await api.getUnreadNotificationCount();
            set({ unreadCount: response.count || 0 });
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    },

    markAsRead: async (id: number) => {
        try {
            await api.markNotificationAsRead(id);
            // Optimistic update
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error('Failed to mark as read', error);
            get().fetchUnreadCount();
        }
    },

    markAllAsRead: async () => {
        // Implement if backend supports it
    },

    addNotification: (notification: Notification) => {
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    }
}));
