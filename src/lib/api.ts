// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';

// Generic API response type
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Auction types
export interface Auction {
    id: number;
    productName: string;
    productDescription: string;
    imageUrl?: string;
    startPrice: number;
    currentPrice: number;
    bidCount: number;
    status: 'PENDING' | 'ACTIVE' | 'ENDED';
    startedAt: string;
    endedAt: string;
}

export interface BidLog {
    id: number;
    bidderId: number;
    bidderNickname: string;
    bidAmount: number;
    createdAt: string;
}

// Payment types
export interface WalletTransaction {
    id: number;
    transactionType: string;
    balanceDelta: number;
    balanceAfter: number;
    createdAt: string;
}

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
                bidCount: 23,
                status: 'ACTIVE',
                startedAt: "2026-01-20T10:00:00",
                endedAt: "2026-01-22T22:00:00"
            },
            {
                id: 2,
                productName: "레고 테크닉 포르쉐 911 GT3 RS",
                productDescription: "2,704 피스. 완벽한 디테일의 슈퍼카.",
                imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
                startPrice: 350000,
                currentPrice: 520000,
                bidCount: 15,
                status: 'ACTIVE',
                startedAt: "2026-01-19T14:00:00",
                endedAt: "2026-01-21T20:00:00"
            },
            {
                id: 3,
                productName: "레고 해리포터 호그와트 성",
                productDescription: "6,020 피스. 마법의 세계가 현실로.",
                imageUrl: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400",
                startPrice: 500000,
                currentPrice: 780000,
                bidCount: 31,
                status: 'ACTIVE',
                startedAt: "2026-01-18T09:00:00",
                endedAt: "2026-01-20T21:00:00"
            },
            {
                id: 4,
                productName: "레고 닌자고 시티 가든",
                productDescription: "5,685 피스. 닌자고 10주년 기념 세트.",
                imageUrl: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400",
                startPrice: 300000,
                currentPrice: 300000,
                bidCount: 0,
                status: 'PENDING',
                startedAt: "2026-01-25T10:00:00",
                endedAt: "2026-01-27T22:00:00"
            }
        ];
    },

    // 입찰하기
    createBid: async (auctionId: number, bidAmount: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/bids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bidAmount })
        });
        if (!res.ok) throw new Error('입찰 실패');
    },

    // 입찰 기록 조회
    getBidLogs: async (auctionId: number): Promise<BidLog[]> => {
        const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/bids`);
        const data = await res.json();
        return data.data?.content || [];
    },

    // 지갑 충전 요청
    requestPayment: async (memberId: number, amount: number): Promise<{ orderId: string }> => {
        const res = await fetch(`${API_BASE}/api/v1/payments/charges?memberId=${memberId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        return res.json();
    },

    // 지갑 거래 내역 조회
    getWalletTransactions: async (memberId: number): Promise<WalletTransaction[]> => {
        const res = await fetch(`${API_BASE}/api/v1/payments/me/wallet-transactions?memberId=${memberId}`);
        const data = await res.json();
        return data.data?.content || [];
    }
};
