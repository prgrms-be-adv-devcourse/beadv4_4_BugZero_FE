import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from './useAuthStore';
import { toast } from 'react-hot-toast';

interface WishlistStore {
    likedAuctionIds: Set<number>;
    isLoaded: boolean;
    fetchMyBookmarks: () => Promise<void>;
    toggleBookmark: (auctionId: number) => Promise<void>;
    reset: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
    likedAuctionIds: new Set(),
    isLoaded: false,

    fetchMyBookmarks: async () => {
        const { isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn) {
            set({ likedAuctionIds: new Set(), isLoaded: true });
            return;
        }

        try {
            // 처음에는 100개 정도 넉넉하게 가져와서 세팅 (페이징 한계 존재)
            // 실제 프로덕션에서는 전체를 다 가져오거나, 페이지별로 체크해야 하지만
            // 현재 구조상 '찜 여부' 필드가 없으므로 리스트를 먼저 로드하는 방식 사용
            const response = await api.getMyBookmarks({ page: 0, size: 100 });
            const ids = new Set((response.data || []).map(item => item.auctionInfo?.auctionId).filter((id): id is number => !!id));
            set({ likedAuctionIds: ids, isLoaded: true });
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
            // 에러 나도 로드 상태는 true로 변경하여 무한 로딩 방지
            set({ isLoaded: true });
        }
    },

    toggleBookmark: async (auctionId: number) => {
        const { likedAuctionIds } = get();
        const isLiked = likedAuctionIds.has(auctionId);

        // Optimistic Update
        const newSet = new Set(likedAuctionIds);
        if (isLiked) {
            newSet.delete(auctionId);
        } else {
            newSet.add(auctionId);
        }
        set({ likedAuctionIds: newSet });

        try {
            if (isLiked) {
                await api.removeBookmark(auctionId);
                toast.success('관심 목록에서 제거되었습니다. 🗑️');
            } else {
                await api.addBookmark(auctionId);
                toast.success('관심 목록에 추가되었습니다! ❤️');
            }
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
            // Revert on failure
            set({ likedAuctionIds: likedAuctionIds });
            toast.error('관심 경매 설정에 실패했습니다.');
        }
    },

    reset: () => {
        set({ likedAuctionIds: new Set(), isLoaded: false });
    }
}));
