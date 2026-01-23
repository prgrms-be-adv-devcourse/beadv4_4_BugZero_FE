import { create } from 'zustand';
import { api } from '@/lib/api';
import type { components } from '@/api/schema';

type MemberInfo = components['schemas']['MemberMeResponseDto'];

interface MemberState {
    memberInfo: MemberInfo | null;
    isSeller: boolean;
    isLoaded: boolean;
    isFetching: boolean;
    fetchMemberInfo: (force?: boolean) => Promise<MemberInfo | null>;
    clearMemberInfo: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
    memberInfo: null,
    isSeller: false,
    isLoaded: false,
    isFetching: false,

    fetchMemberInfo: async (force = false) => {
        const { isFetching, isLoaded, memberInfo } = get();

        // 데이터가 이미 있고 강제 갱신이 아니면 캐시 반환
        if (isLoaded && memberInfo && !force) {
            return memberInfo;
        }

        // 이미 요청 중이면 중복 요청 방지
        if (isFetching) {
            return null;
        }

        set({ isFetching: true });

        try {
            const info = await api.getMe();
            if (info) {
                // 필수 정보 체크하여 실질적인 SELLER 여부 판단
                const hasIdentity = !!(info.realNameMasked && info.contactPhoneMasked);
                const hasAddress = !!(info.address && info.zipCode);
                const isRealSeller = info.role === 'SELLER' && hasIdentity && hasAddress;

                set({
                    memberInfo: info,
                    isSeller: isRealSeller,
                    isLoaded: true
                });
                return info;
            }
        } catch (error) {
            console.error('Failed to fetch member info in store:', error);
            set({ memberInfo: null, isSeller: false, isLoaded: true });
        } finally {
            set({ isFetching: false });
        }
        return null;
    },

    clearMemberInfo: () => {
        set({ memberInfo: null, isSeller: false, isLoaded: false, isFetching: false });
    }
}));
