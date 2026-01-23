'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useEffect, useState } from "react";

interface LikeButtonProps {
    auctionId: number;
    className?: string;
}

import toast from "react-hot-toast"; // ✅ 추가

export default function LikeButton({ auctionId, className = "" }: LikeButtonProps) {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const { likedAuctionIds, toggleBookmark } = useWishlistStore();

    // Hydration mismatch 방지: 브라우저에서만 렌더링 확정
    const [mounted, setMounted] = useState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setMounted(true);
    }, []);

    const isLiked = mounted && likedAuctionIds.has(auctionId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            toast.error('로그인이 필요한 서비스입니다.');
            return;
        }

        toggleBookmark(auctionId);
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center transition active:scale-95 ${className}`}
            aria-label={isLiked ? "관심 취소" : "관심 등록"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-6 h-6 ${isLiked ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-400"}`}
            >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
        </button>
    );
}
