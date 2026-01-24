'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useSyncExternalStore, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface LikeButtonProps {
    auctionId: number;
    className?: string;
}

const emptySubscribe = () => () => { };

export default function LikeButton({ auctionId, className = "" }: LikeButtonProps) {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const { likedAuctionIds, toggleBookmark } = useWishlistStore();
    const [isAnimate, setIsAnimate] = useState(false);

    // Hydration mismatch 방지
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const isLiked = isClient && likedAuctionIds.has(auctionId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            toast.error('로그인이 필요한 서비스입니다.');
            return;
        }

        // 새롭게 찜하는 경우에만 애니메이션 실행
        if (!isLiked) {
            setIsAnimate(true);
            setTimeout(() => setIsAnimate(false), 600);
        }

        toggleBookmark(auctionId);
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center transition active:scale-95 ${className} relative overflow-visible`}
            aria-label={isLiked ? "관심 취소" : "관심 등록"}
        >
            <style jsx>{`
                @keyframes heartPop {
                    0% { transform: scale(1); }
                    15% { transform: scale(1.4); }
                    30% { transform: scale(1.1); }
                    45% { transform: scale(1.3); }
                    100% { transform: scale(1.1); }
                }
                @keyframes sparkle {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .heart-animate {
                    animation: heartPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .sparkle-effect::before,
                .sparkle-effect::after {
                    content: '';
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #f43f5e;
                    border-radius: 50%;
                    animation: sparkle 0.6s ease-out forwards;
                    z-index: 10;
                }
                .sparkle-effect::before { top: -4px; left: 10%; }
                .sparkle-effect::after { bottom: -4px; right: 10%; }
            `}</style>
            <div className={`relative ${isAnimate ? "sparkle-effect" : ""}`}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-6 h-6 transition-all duration-300 transform ${isLiked
                        ? `text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] ${isAnimate ? "heart-animate" : "scale-110"}`
                        : "text-gray-400 hover:text-rose-400 hover:scale-110"
                        }`}
                >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
            </div>
        </button>
    );
}
