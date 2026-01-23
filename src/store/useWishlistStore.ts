
import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

// Debounce timer map (module-level since store is singleton)
const debounceTimers: Record<number, NodeJS.Timeout> = {};

interface WishlistStore {
    likedAuctionIds: Set<number>; // UI State (Optimistic)
    syncedLikedAuctionIds: Set<number>; // Server State (Confirmed)
    isLoaded: boolean;
    fetchMyBookmarks: () => Promise<void>;
    toggleBookmark: (auctionId: number) => Promise<void>;
    reset: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
    likedAuctionIds: new Set(),
    syncedLikedAuctionIds: new Set(),
    isLoaded: false,

    fetchMyBookmarks: async () => {
        const { isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn) {
            set({ likedAuctionIds: new Set(), syncedLikedAuctionIds: new Set(), isLoaded: true });
            return;
        }

        try {
            // 처음에는 100개 정도 넉넉하게 가져와서 세팅
            const response = await api.getMyBookmarks({ page: 0, size: 100 });
            const ids = new Set((response.data || []).map(item => item.auctionInfo?.auctionId).filter((id): id is number => !!id));
            set({ likedAuctionIds: ids, syncedLikedAuctionIds: new Set(ids), isLoaded: true });
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
            set({ isLoaded: true });
        }
    },

    toggleBookmark: async (auctionId: number) => {
        const { likedAuctionIds } = get();
        const isLiked = likedAuctionIds.has(auctionId);

        // 1. Optimistic Update (UI immediately reflects change)
        const newSet = new Set(likedAuctionIds);
        if (isLiked) {
            newSet.delete(auctionId);
        } else {
            newSet.add(auctionId);
        }
        set({ likedAuctionIds: newSet });

        // 2. Debounce Server Request
        // Clear previous timer for this ID
        if (debounceTimers[auctionId]) {
            clearTimeout(debounceTimers[auctionId]);
        }

        // Set new timer
        debounceTimers[auctionId] = setTimeout(async () => {
            const { likedAuctionIds: currentUiState, syncedLikedAuctionIds } = get();
            const finalIsLiked = currentUiState.has(auctionId);
            const serverIsLiked = syncedLikedAuctionIds.has(auctionId);

            // If UI state matches Server state, no need to request
            if (finalIsLiked === serverIsLiked) {
                delete debounceTimers[auctionId];
                return;
            }

            try {
                if (finalIsLiked) {
                    await api.addBookmark(auctionId);
                } else {
                    await api.removeBookmark(auctionId);
                }

                // On success, update synced state
                const newSynced = new Set(syncedLikedAuctionIds);
                if (finalIsLiked) newSynced.add(auctionId);
                else newSynced.delete(auctionId);
                set({ syncedLikedAuctionIds: newSynced });

            } catch (error) {
                console.error('Failed to toggle bookmark:', error);
                // Revert UI to match Server state (which is the last known good state)
                const revertedSet = new Set(get().likedAuctionIds);
                if (serverIsLiked) revertedSet.add(auctionId);
                else revertedSet.delete(auctionId);

                set({ likedAuctionIds: revertedSet });
                alert('관심 경매 설정에 실패했습니다.');
            } finally {
                delete debounceTimers[auctionId];
            }
        }, 500); // 500ms debounce
    },

    reset: () => {
        set({ likedAuctionIds: new Set(), syncedLikedAuctionIds: new Set(), isLoaded: false });
    }
}));
