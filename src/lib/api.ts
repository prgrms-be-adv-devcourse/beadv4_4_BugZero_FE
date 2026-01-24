import { client } from "@/api/client";
import { components } from "@/api/schema";
import { getErrorMessage } from "@/api/utils";
import { authApi } from "@/api/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';

// Helper types from Schema
export type AuctionDetailResponseDto = components["schemas"]["AuctionDetailResponseDto"];
export type AuctionListResponseDto = components["schemas"]["AuctionListResponseDto"];
export type PagedAuctionList = components["schemas"]["PagedResponseDtoAuctionListResponseDto"];

// Removed duplicate type BidLog = ...
export type MyBid = components["schemas"]["MyBidResponseDto"];
export type MySale = components["schemas"]["MySaleResponseDto"];
export type MyAuctionOrder = components["schemas"]["MyAuctionOrderListResponseDto"];
export type MemberInfo = components["schemas"]["MemberMeResponseDto"];
export type ProductInspectionResponseDto = components["schemas"]["ProductInspectionResponseDto"];
export type ProductResponseForInspectionDto = components["schemas"]["ProductResponseForInspectionDto"];
export type WalletTransaction = components["schemas"]["WalletTransactionResponseDto"];
export type Wallet = components["schemas"]["WalletResponseDto"];
export type Settlement = components["schemas"]["SettlementResponseDto"];
export type PresignedUrlResponse = components["schemas"]["PresignedUrlResponseDto"];


// Expanded Auction type for Frontend compatibility (Adapter)
// We use Partial/Required to force fields to be non-nullable where the UI expects them
export interface Auction extends Omit<AuctionDetailResponseDto, "status" | "startTime" | "endTime" | "auctionId" | "productId"> {
    id: number;
    auctionId: number;
    productId: number;
    productName: string;
    productDescription: string;
    imageUrls?: string[];
    // Flat fields expected by UI
    startPrice: number;
    currentPrice: number;
    tickSize: number;
    bidCount: number;
    // Required fields from DTO (overriding optionals)
    status: "SCHEDULED" | "IN_PROGRESS" | "ENDED" | "WITHDRAWN";
    startTime: string;
    endTime: string;
}

// Fix BidLog: UI expects mandatory fields
export interface BidLog {
    id: number;
    publicId: string;
    bidAmount: number;
    bidTime: string;
}

// Helper to handle API responses and unwrap data
async function handleResponseData<T>(promise: Promise<{ data?: unknown; error?: unknown }>, errorMessage: string): Promise<T> {
    const { data, error } = await promise;

    if (error) {
        throw new Error(getErrorMessage(error, errorMessage));
    }

    if (data === undefined || data === null) {
        throw new Error(errorMessage + " (No data received)");
    }

    // Check if it's a wrapper DTO (standard backend response format)
    // Most responses are wrapped in SuccessResponseDto* which has 'data', 'status', 'message'
    if (typeof data === 'object' && 'data' in data && 'status' in data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (data as any).status;
        if (typeof status === 'number') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data as any).data;
        }
    }

    // If it's a primitive (like number for count endpoints) or non-wrapped object (like PagedResponse)
    return data as T;
}

export const api = {
    // 상품
    createProduct: async (body: components["schemas"]["ProductCreateRequestDto"]) => {
        return handleResponseData<components["schemas"]["ProductCreateResponseDto"]>(
            client.POST("/api/v1/products", {
                body
            }),
            "상품 등록에 실패했습니다."
        );
    },

    updateProduct: async (productId: number, body: components["schemas"]["ProductUpdateDto"]) => {
        return handleResponseData<components["schemas"]["ProductUpdateResponseDto"]>(
            client.PATCH("/api/v1/products/{productId}", {
                params: { path: { productId } },
                body
            }),
            "상품 수정에 실패했습니다."
        );
    },

    getPresignedUrl: async (body: components["schemas"]["PresignedUrlRequestDto"]) => {
        return handleResponseData<components["schemas"]["PresignedUrlResponseDto"]>(
            client.POST("/api/v1/products/images/presigned-url", { body }),
            "업로드 권한을 가져오지 못했습니다."
        );
    },

    // 경매
    getAuctions: async (
        condition: components["schemas"]["AuctionSearchCondition"] = {},
        pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }
    ) => {
        // 백엔드(@ModelAttribute)는 평탄화된 쿼리 파라미터를 기대하므로 Nesting을 제거
        // 또한 undefined 나 null 인 필드는 제외하여 백엔드에서 기본값이 잘 적용되도록 함
        const queryParams = {
            ...condition,
            ...pageable
        };
        const cleanQuery = Object.fromEntries(
            Object.entries(queryParams).filter(([k, v]) => k && v != null && v !== "")
        );

        return handleResponseData<components["schemas"]["PagedResponseDtoAuctionListResponseDto"]>(
            client.GET("/api/v1/auctions", {
                // @ts-expect-error - Backend expects flattened query parameters for @ModelAttribute
                params: { query: cleanQuery as unknown }
            }),
            "경매 목록을 불러오는 데 실패했습니다."
        );
    },

    // Simplified: Now use the enriched detail API directly
    getAuction: async (auctionId: number): Promise<Auction> => {
        const detail = await handleResponseData<components["schemas"]["AuctionDetailResponseDto"]>(
            client.GET("/api/v1/auctions/{auctionId}", {
                params: { path: { auctionId } }
            }),
            "경매 정보를 불러오는 데 실패했습니다."
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = detail as any;

        return {
            ...detail,
            id: detail.auctionId || auctionId,
            auctionId: detail.auctionId || auctionId,
            productId: detail.productId || 0,
            productName: d.productName || "상품명 없음",
            productDescription: d.productDescription || "",
            imageUrls: d.imageUrls || (d?.thumbnailUrl ? [d.thumbnailUrl] : []),
            startPrice: detail.price?.startPrice || 0,
            currentPrice: detail.price?.currentPrice || 0,
            tickSize: detail.price?.tickSize || 0,
            bidCount: d.bidsCount || 0,
            status: detail.status || "SCHEDULED",
            startTime: detail.startTime || "",
            endTime: detail.endTime || ""
        };
    },

    createAuction: async (productId: number, publicId: string, body: components["schemas"]["ProductAuctionRequestDto"]) => {
        return handleResponseData<number>(
            client.POST("/api/v1/internal/auctions/{productId}/{publicId}", {
                params: { path: { productId, publicId } },
                body
            }),
            "경매 생성에 실패했습니다."
        );
    },

    updateAuction: async (publicId: string, body: components["schemas"]["ProductAuctionUpdateDto"]) => {
        return handleResponseData<number>(
            client.PATCH("/api/v1/internal/auctions/{publicId}", {
                params: { path: { publicId } },
                body
            }),
            "경매 수정에 실패했습니다."
        );
    },

    withdrawAuction: async (auctionId: number) => {
        return handleResponseData<components["schemas"]["AuctionWithdrawResponseDto"]>(
            client.POST("/api/v1/auctions/{auctionId}/withdraw", {
                params: { path: { auctionId } }
            }),
            "판매 포기에 실패했습니다."
        );
    },

    getAuctionSubscribers: async (auctionId: number) => {
        return handleResponseData<number>(
            client.GET("/api/v1/auctions/{auctionId}/subscribers/count", {
                params: { path: { auctionId } }
            }),
            "관심 인원 수 조회 실패"
        );
    },

    // 입찰
    getBids: async (auctionId: number, pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }) => {
        const data = await handleResponseData<components["schemas"]["PagedResponseDtoBidLogResponseDto"]>(
            client.GET("/api/v1/auctions/{auctionId}/bids", {
                params: { path: { auctionId }, query: { pageable } }
            }),
            "입찰 기록을 불러오는 데 실패했습니다."
        );
        return (data.data || []) as BidLog[];
    },

    // 호환성 유지를 위해 이름 변경 (getBidLogs -> getBids 사용 권장)
    getBidLogs: async (auctionId: number) => {
        const data = await handleResponseData<components["schemas"]["PagedResponseDtoBidLogResponseDto"]>(
            client.GET("/api/v1/auctions/{auctionId}/bids", {
                params: { path: { auctionId }, query: { pageable: { page: 0, size: 100 } } }
            }),
            "입찰 기록을 불러오는 데 실패했습니다."
        );
        return (data.data || []) as BidLog[];
    },

    createBid: async (auctionId: number, bidAmount: number) => {
        return handleResponseData<components["schemas"]["BidResponseDto"]>(
            client.POST("/api/v1/auctions/{auctionId}/bids", {
                params: { path: { auctionId } },
                body: { bidAmount }
            }),
            "입찰에 실패했습니다."
        );
    },

    // 낙찰/주문
    getAuctionOrder: async (auctionId: number) => {
        return handleResponseData<components["schemas"]["AuctionOrderResponseDto"]>(
            client.GET("/api/v1/auctions/{auctionId}/order", {
                params: { path: { auctionId } }
            }),
            "낙찰 상세 정보를 불러오는 데 실패했습니다."
        );
    },

    auctionFinalPayment: async (auctionId: number, body: components["schemas"]["AuctionFinalPaymentRequestDto"]) => {
        return handleResponseData<components["schemas"]["AuctionFinalPaymentResponseDto"]>(
            client.POST("/api/v1/payments/auctions/{auctionId}", {
                params: { path: { auctionId } },
                body
            }),
            "낙찰 결제에 실패했습니다."
        );
    },

    // 회원
    getMe: async () => {
        return handleResponseData<components["schemas"]["MemberMeResponseDto"]>(
            client.GET("/api/v1/members/me"),
            "내 정보를 불러오는 중 오류가 발생했습니다."
        );
    },

    updateMe: async (body: components["schemas"]["MemberUpdateRequestDto"]) => {
        return handleResponseData<components["schemas"]["MemberUpdateResponseDto"]>(
            client.PATCH("/api/v1/members/me", { body }),
            "회원 정보 수정에 실패했습니다."
        );
    },

    // Alias for compatibility
    updateMemberInfo: async (body: components["schemas"]["MemberUpdateRequestDto"]) => {
        return api.updateMe(body);
    },

    updateProfile: async (body: components["schemas"]["MemberUpdateRequestDto"]) => {
        return api.updateMe(body);
    },

    updateIdentity: async (body: components["schemas"]["MemberUpdateIdentityRequestDto"]) => {
        return handleResponseData<components["schemas"]["MemberUpdateResponseDto"]>(
            client.PATCH("/api/v1/members/me/identity", { body }),
            "본인 인증 정보 수정에 실패했습니다."
        );
    },

    promoteSeller: async () => {
        return handleResponseData<void>(
            client.POST("/api/v1/members/me/seller"),
            "판매자 등록에 실패했습니다."
        );
    },

    verifyParticipation: async () => {
        return handleResponseData<void>(
            client.GET("/api/v1/members/participation"),
            "입찰 참여 자격 확인에 실패했습니다."
        );
    },

    // 마이페이지 (내 활동)
    getMySales: async (filter: "ALL" | "ONGOING" | "COMPLETED" | "ACTION_REQUIRED" = "ALL", pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }) => {
        return handleResponseData<components["schemas"]["PagedResponseDtoMySaleResponseDto"]>(
            client.GET("/api/v1/members/me/sales", {
                params: { query: { filter, pageable } }
            }),
            "나의 판매 내역을 불러오는 데 실패했습니다."
        );
    },

    getMyBids: async (auctionStatus?: "SCHEDULED" | "IN_PROGRESS" | "ENDED" | "WITHDRAWN", pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }) => {
        return handleResponseData<components["schemas"]["PagedResponseDtoMyBidResponseDto"]>(
            client.GET("/api/v1/members/me/bids", {
                params: { query: { auctionStatus, pageable } }
            }),
            "나의 입찰 내역을 불러오는 데 실패했습니다."
        );
    },

    getMyAuctionOrders: async (status?: "PROCESSING" | "SUCCESS" | "FAILED", pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }) => {
        return handleResponseData<components["schemas"]["PagedResponseDtoMyAuctionOrderListResponseDto"]>(
            client.GET("/api/v1/members/me/orders", {
                params: { query: { status, pageable } }
            }),
            "나의 낙찰 내역을 불러오는 데 실패했습니다."
        );
    },

    getMyBookmarks: async (pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }) => {
        return handleResponseData<components["schemas"]["PagedResponseDtoWishlistListResponseDto"]>(
            client.GET("/api/v1/members/me/bookmarks", {
                params: { query: { pageable } }
            }),
            "관심 목록을 불러오는 데 실패했습니다."
        );
    },

    addBookmark: async (auctionId: number) => {
        return handleResponseData<components["schemas"]["WishlistAddResponseDto"]>(
            client.POST("/api/v1/auctions/{auctionId}/bookmarks", {
                params: { path: { auctionId } }
            }),
            "관심 등록 실패"
        );
    },

    removeBookmark: async (auctionId: number) => {
        return handleResponseData<components["schemas"]["WishlistRemoveResponseDto"]>(
            client.DELETE("/api/v1/auctions/{auctionId}/bookmarks", {
                params: { path: { auctionId } }
            }),
            "관심 해제 실패"
        );
    },

    // 결제/지갑
    requestPayment: async (amount: number) => {
        return handleResponseData<components["schemas"]["PaymentRequestResponseDto"]>(
            client.POST("/api/v1/payments/charges", {
                body: { amount }
            }),
            "결제 요청 중 오류가 발생했습니다."
        );
    },

    confirmPayment: async (body: components["schemas"]["PaymentConfirmRequestDto"]) => {
        return handleResponseData<components["schemas"]["PaymentConfirmResponseDto"]>(
            client.POST("/api/v1/payments/charges/confirm", { body }),
            "결제 승인 중 오류가 발생했습니다."
        );
    },

    getMyWallet: async () => {
        return handleResponseData<components["schemas"]["WalletResponseDto"]>(
            client.GET("/api/v1/payments/me/wallet"),
            "지갑 정보를 불러오는 데 실패했습니다."
        );
    },

    getWalletTransactions: async (page: number = 0, size: number = 20, transactionType?: components["schemas"]["WalletTransactionResponseDto"]["type"]) => {
        const data = await handleResponseData<components["schemas"]["PagedResponseDtoWalletTransactionResponseDto"]>(
            client.GET("/api/v1/payments/me/wallet-transactions", {
                params: { query: { page, size, transactionType } }
            }),
            "지갑 내역 조회 실패"
        );
        return data.data || [];
    },

    getSettlements: async (page: number = 0, size: number = 20, status?: components["schemas"]["SettlementResponseDto"]["status"]) => {
        const data = await handleResponseData<components["schemas"]["PagedResponseDtoSettlementResponseDto"]>(
            client.GET("/api/v1/payments/me/settlements", {
                params: { query: { page, size, status } }
            }),
            "정산 내역 조회 실패"
        );
        return data.data || [];
    },

    // 인증
    login: async (body: components["schemas"]["TokenIssueDto"]) => {
        return handleResponseData<string>(
            client.POST("/api/v1/auth/test/login", { body }),
            "로그인 실패"
        );
    },

    refreshAccessToken: async () => {
        return authApi.refreshAccessToken();
    },

    logout: async () => {
        return handleResponseData<void>(
            client.POST("/api/v1/auth/logout"),
            "로그아웃 실패"
        );
    },

    // Helpers (유지)
    calculateDeposit: (startPrice: number): number => {
        return Math.floor(startPrice * 0.1);
    },

    getBidOptions: (minBidPrice: number, tickSize: number): number[] => {
        return [
            minBidPrice,
            minBidPrice + tickSize,
            minBidPrice + tickSize * 2,
        ];
    },

    getAuctionSubscribeUrl: (auctionId: number): string => {
        return `${API_BASE}/api/v1/auctions/${auctionId}/subscribe`;
    },

    // 관리자 - 상품 검수
    getAdminProducts: async (
        condition: components["schemas"]["ProductSearchForInspectionCondition"] = {},
        pageable: components["schemas"]["Pageable"] = { page: 0, size: 10 }
    ) => {
        return handleResponseData<components["schemas"]["PagedResponseDtoProductResponseForInspectionDto"]>(
            client.GET("/api/v1/products/inspections", {
                params: { query: { condition, pageable } }
            }),
            "검수 목록을 불러오는 데 실패했습니다."
        );
    },

    createProductInspection: async (body: components["schemas"]["ProductInspectionRequestDto"]) => {
        return handleResponseData<components["schemas"]["ProductInspectionResponseDto"]>(
            client.POST("/api/v1/products/inspections", { body }),
            "검수 처리에 실패했습니다."
        );
    },

    determineStartAuction: async (productId: number) => {
        return handleResponseData<number>(
            client.PATCH("/api/v1/auctions/{productId}/startTime", {
                params: { path: { productId } }
            }),
            "경매 시작 시간 설정에 실패했습니다."
        );
    },

    // 본인인증 여부 체크 헬퍼
    isVerified: (member: MemberInfo | null | undefined): boolean => {
        if (!member) return false;
        return !!(member.realNameMasked && member.contactPhoneMasked);
    }
};
