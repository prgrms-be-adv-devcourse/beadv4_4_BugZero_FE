import { client } from "@/api/client";
import { components } from "@/api/schema";
import { getErrorMessage } from "@/api/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';
// const API_BASE = 'http://localhost:8080'; // Local development server

// Generic API response type (Commonly used in BE SuccessResponseDto)
interface SuccessResponse<T> {
    status: string; // e.g., "OK", "CREATED"
    data: T;
}

// Note: ApiResponse was removed as it was unused

// Paged response type

interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface PresignedUrlResponse {
    fileName: string;
    presignedUrl: string;
}

export interface ProductResponse {
    productId: number;
    auctionId: number;
    inspectionStatus: string;
}

export interface ProductRequest {
    name: string;
    category: string;
    description: string;
    productAuctionRequestDto: {
        startPrice: number;
        durationDays: number;
    };
    productImageRequestDto: {
        imgUrl: string;
        sortOrder: number;
    }[];
}


// Auction types
export interface Auction {
    id: number;
    productName: string;
    productDescription: string;
    imageUrl?: string;
    startPrice: number;
    currentPrice: number;
    tickSize: number;
    bidCount: number;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED';
    startTime: string;
    endTime: string;
    highestBidderPublicId?: string;
    isMyAuction?: boolean;
}

export interface BidLog {
    id: number;
    publicId: string;
    bidAmount: number;
    bidTime: string;
}

// MyBid type (내 입찰)
export interface MyBid {
    auctionId: number;
    productName: string;
    productImageUrl?: string;
    startPrice: number;
    currentPrice: number;
    myBidAmount: number;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED';
    auctionEndTime: string;
    isWinning: boolean;
}

// MySale type (내 판매)
export interface MySale {
    auctionId: number;
    productId: number;
    productName: string;
    productImageUrl?: string;
    startPrice: number;
    currentPrice: number;
    bidCount: number;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED' | 'FAILED';
    auctionEndTime: string;
}

// Member type
export interface MemberInfo {
    id: string;
    publicId: string;
    email: string;
    nickname?: string;
    role: 'USER' | 'SELLER' | 'ADMIN';
    realName?: string;
    contactPhone?: string;
    address?: string;
    addressDetail?: string;
    zipCode?: string;
    intro?: string;
}

// 본인인증 여부 체크 헬퍼
export const isVerified = (member: MemberInfo | null): boolean => {
    if (!member) return false;
    return !!(member.realName && member.contactPhone);
};

// Payment types
export interface WalletTransaction {
    id: number;
    transactionType: string;
    balanceDelta: number;
    balanceAfter: number;
    createdAt: string;
}

// Helper: get auth token from localStorage
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
};

// Helper: create headers with auth
const createAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// API Functions
export const api = {
    // 경매 목록 조회 (mock - 실제 API 연동 시 수정)
    getAuctions: async (): Promise<Auction[]> => {
        // TODO: 실제 API 연동 시 아래 주석 해제
        // const res = await fetch(`${API_BASE}/api/v1/auctions`);
        // return res.json();

        // Mock data for demo
        return [
            {
                id: 1,
                productName: "레고 스타워즈 밀레니엄 팔콘 75192",
                productDescription: "7,541 피스의 대형 UCS 세트. 미개봉 상태.",
                imageUrl: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400",
                startPrice: 800000,
                currentPrice: 1250000,
                tickSize: 10000,
                bidCount: 23,
                status: 'IN_PROGRESS',
                startTime: "2026-01-20T10:00:00",
                endTime: "2026-01-22T22:00:00"
            },
            {
                id: 2,
                productName: "레고 테크닉 포르쉐 911 GT3 RS",
                productDescription: "2,704 피스. 완벽한 디테일의 슈퍼카.",
                imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
                startPrice: 350000,
                currentPrice: 520000,
                tickSize: 5000,
                bidCount: 15,
                status: 'IN_PROGRESS',
                startTime: "2026-01-19T14:00:00",
                endTime: "2026-01-21T20:00:00"
            },
            {
                id: 3,
                productName: "레고 해리포터 호그와트 성",
                productDescription: "6,020 피스. 마법의 세계가 현실로.",
                imageUrl: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400",
                startPrice: 500000,
                currentPrice: 780000,
                tickSize: 5000,
                bidCount: 31,
                status: 'IN_PROGRESS',
                startTime: "2026-01-18T09:00:00",
                endTime: "2026-01-20T21:00:00"
            },
            {
                id: 4,
                productName: "레고 닌자고 시티 가든",
                productDescription: "5,685 피스. 닌자고 10주년 기념 세트.",
                imageUrl: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400",
                startPrice: 300000,
                currentPrice: 300000,
                tickSize: 5000,
                bidCount: 0,
                status: 'SCHEDULED',
                startTime: "2026-01-25T10:00:00",
                endTime: "2026-01-27T22:00:00"
            }
        ];
    },

    // 경매 상세 조회
    getAuction: async (id: number): Promise<Auction> => {
        const res = await fetch(`${API_BASE}/api/v1/auctions/${id}`, {
            headers: createAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch auction: ${res.status}`);
        }
        const json: SuccessResponse<Auction> = await res.json();
        return json.data;
    },

    // 입찰하기
    createBid: async (auctionId: number, bidAmount: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/bids`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify({ bidAmount })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || '입찰 실패');
        }
    },

    // 입찰 기록 조회
    getBidLogs: async (auctionId: number): Promise<BidLog[]> => {
        const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/bids`);
        if (!res.ok) {
            throw new Error(`Failed to fetch bid logs: ${res.status}`);
        }
        const json: SuccessResponse<PagedResponse<BidLog>> = await res.json();
        return json.data?.content || [];
    },

    // 내 입찰 목록 조회
    getMyBids: async (auctionStatus?: string): Promise<PagedResponse<MyBid>> => {
        try {
            let url = `${API_BASE}/api/v1/members/me/bids`;
            if (auctionStatus) {
                url += `?auctionStatus=${auctionStatus}`;
            }
            const res = await fetch(url, {
                headers: createAuthHeaders(),
            });
            if (!res.ok) throw new Error('API error');
            const json: SuccessResponse<PagedResponse<MyBid>> = await res.json();
            return json.data || { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
        } catch {
            console.log('getMyBids API 실패, Mock 데이터 사용');

            // Mock 데이터 반환
            return {
                content: [
                    { auctionId: 1, productName: '레고 스타워즈 밀레니엄 팔콘', startPrice: 800000, currentPrice: 1250000, myBidAmount: 1250000, status: 'IN_PROGRESS', auctionEndTime: '2026-01-22T22:00:00', isWinning: true },
                    { auctionId: 2, productName: '레고 테크닉 포르쉐 911', startPrice: 350000, currentPrice: 520000, myBidAmount: 480000, status: 'IN_PROGRESS', auctionEndTime: '2026-01-21T20:00:00', isWinning: false },
                ],
                totalElements: 2, totalPages: 1, size: 20, number: 0
            };
        }
    },

    // 내 판매 목록 조회 (판매자 전용)
    getMySales: async (filter: string = 'ALL'): Promise<PagedResponse<MySale>> => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/members/me/sales?filter=${filter}`, {
                headers: createAuthHeaders(),
            });
            if (!res.ok) throw new Error('API error');
            const json: SuccessResponse<PagedResponse<MySale>> = await res.json();
            return json.data || { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
        } catch {
            console.log('getMySales API 실패, Mock 데이터 사용');

            return {
                content: [
                    { auctionId: 3, productId: 3, productName: '레고 해리포터 호그와트 성', startPrice: 500000, currentPrice: 780000, bidCount: 31, status: 'IN_PROGRESS', auctionEndTime: '2026-01-20T21:00:00' },
                    { auctionId: 4, productId: 4, productName: '레고 닌자고 시티 가든', startPrice: 300000, currentPrice: 300000, bidCount: 0, status: 'FAILED', auctionEndTime: '2026-01-18T22:00:00' },
                ],
                totalElements: 2, totalPages: 1, size: 10, number: 0
            };
        }
    },

    // 엑세스 토큰 재발급
    refreshAccessToken: async () => {
        const { data, error } = await client.POST("/api/v1/auth/refresh");

        if (error || !data) {
            throw new Error(getErrorMessage(error, "세션이 만료되었습니다. 다시 로그인해주세요."));
        }

        return data.data;
    },

    // 로그아웃
    logout: async () => {
        const { data, error } = await client.POST("/api/v1/auth/logout", {});

        if (error) {
            throw new Error(getErrorMessage(error, "로그아웃 처리 중 오류가 발생했습니다."));
        }
        return data;
    },

    // 내 정보 조회
    getMe: async () => {
        const { data, error } = await client.GET("/api/v1/members/me");

        if (error || !data) {
            throw new Error(getErrorMessage(error, "내 정보를 불러오는 중 오류가 발생했습니다."));
        }

        return data.data;
    },

    // 예치금 결제 요쳥
    requestPayment: async (amount: number) => {
        const { data, error } = await client.POST("/api/v1/payments/charges", {
            body: { amount },
        });

        if (error || !data) {
            throw new Error(getErrorMessage(error, "결제 요청 중 오류가 발생했습니다."));
        }

        return data.data;
    },

    // 지갑 거래 내역 조회
    getWalletTransactions: async (memberId: string): Promise<WalletTransaction[]> => {
        const res = await fetch(`${API_BASE}/api/v1/payments/me/wallet-transactions?memberId=${memberId}`, {
            headers: createAuthHeaders(),
        });
        const json: SuccessResponse<PagedResponse<WalletTransaction>> = await res.json();
        return json.data?.content || [];
    },

    // S3 Presigned URL 발급
    getPresignedUrl: async (payload: { fileName: string; contentType: string }) => {
        const { data, error } = await client.POST("/api/v1/products/images/presigned-url", {
            body: payload,
        });
        if (error || !data) {
            throw new Error(getErrorMessage(error, "업로드 권한을 가져오지 못했습니다."));
        }
        return data.data;
    },

    // 판매자 등록
    promoteSeller: async () => {
        const { data, error } = await client.POST("/api/v1/members/me/seller");

        if (error) {
            throw new Error(getErrorMessage(error, "판매자 등록에 실패했습니다."));
        }

        return data;
    },

    // 실명/연락처 (본인 인증)
    updateIdentity: async (payload: components["schemas"]["MemberUpdateIdentityRequestDto"]) => {
        const { data, error } = await client.PATCH("/api/v1/members/me/identity", {
            body: payload,
        });
        if (error || !data) throw new Error(getErrorMessage(error, "본인 인증 실패"));
        return data.data;
    },

    // 회원 정보 수정
    updateMemberInfo: async (payload: components["schemas"]["MemberUpdateRequestDto"]) => {
        const { data, error } = await client.PATCH("/api/v1/members/me", {
            body: payload,
        });
        if (error || !data) throw new Error(getErrorMessage(error, "회원 정보 수정 실패"));
        return data.data;
    },

    // 상품 및 경매 등록
    createProduct: async (memberPublicId: string, productData: any) => {
        const { data, error } = await client.POST("/api/v1/products", {
            params: {
                query: { publicId: memberPublicId }
            },
            body: productData,
        });

        if (error || !data) {
            throw new Error(getErrorMessage(error, "상품 등록에 실패했습니다."));
        }

        return data.data;
    },


    // 예치금 결제 승인
    confirmPayment: async (paymentData: {
        paymentKey: string;
        orderId: string;
        amount: number;
    }) => {
        const { data, error } = await client.POST("/api/v1/payments/charges/confirm", {
            body: paymentData,
        });

        if (error || !data) {
            throw new Error(getErrorMessage(error, "결제 승인 중 오류가 발생했습니다."));
        }

        return data.data;
    },

    // 보증금 계산 (시작가의 10%)
    calculateDeposit: (startPrice: number): number => {
        return Math.floor(startPrice * 0.1);
    },

    // 호가 단위 계산
    // 10만원 이하: 1천원 단위
    // 10만원~100만원: 5천원 단위
    // 100만원 이상: 1만원 단위
    getBidIncrement: (currentPrice: number): number => {
        if (currentPrice < 100000) return 1000;        // 10만원 이하: 1천원
        if (currentPrice < 1000000) return 5000;       // 100만원 이하: 5천원
        return 10000;                                   // 100만원 이상: 1만원
    },

    // 다음 최소 입찰가 계산
    getNextMinBid: (currentPrice: number): number => {
        const increment = api.getBidIncrement(currentPrice);
        return currentPrice + increment;
    },

    // 입찰 가능 금액 옵션 생성 (3개)
    getBidOptions: (currentPrice: number): number[] => {
        const increment = api.getBidIncrement(currentPrice);
        return [
            currentPrice + increment,
            currentPrice + increment * 2,
            currentPrice + increment * 3,
        ];
    },

    // SSE 구독 URL 생성
    getAuctionSubscribeUrl: (auctionId: number): string => {
        return `${API_BASE}/api/v1/auctions/${auctionId}/subscribe`;
    },

    // 프로필 업데이트 (본인인증 포함)
    updateProfile: async (data: {
        realName?: string;
        contactPhone?: string;
        nickname?: string;
        address?: string;
        addressDetail?: string;
        zipCode?: string;
        intro?: string;
    }): Promise<void> => {
        const res = await fetch(`${API_BASE}/api/v1/members/me`, {
            method: 'PUT',
            headers: createAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('프로필 업데이트 실패');
    }
};

