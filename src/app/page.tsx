'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { components } from '@/api/schema';

type Auction = components["schemas"]["AuctionListResponseDto"];
type PageDto = components["schemas"]["PageDto"];

const MOCK_AUCTIONS: Auction[] = [
  {
    auctionId: 1,
    productName: "레고 스타워즈 밀레니엄 팔콘 75192",
    thumbnailUrl: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500",
    currentPrice: 1250000,
    auctionStatus: "IN_PROGRESS",
    endTime: "2026-01-25T22:00:00",
  },
  {
    auctionId: 2,
    productName: "레고 테크닉 포르쉐 911 GT3 RS",
    thumbnailUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500",
    currentPrice: 520000,
    auctionStatus: "IN_PROGRESS",
    endTime: "2026-01-24T20:00:00",
  },
  {
    auctionId: 3,
    productName: "레고 해리포터 호그와트 성",
    thumbnailUrl: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500",
    currentPrice: 780000,
    auctionStatus: "ENDED",
    endTime: "2026-01-20T21:00:00",
  },
  {
    auctionId: 4,
    productName: "레고 닌자고 시티 가든",
    thumbnailUrl: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=500",
    currentPrice: 300000,
    auctionStatus: "SCHEDULED",
    endTime: "2026-01-28T22:00:00",
  }
];

function formatPrice(price?: number): string {
  return new Intl.NumberFormat('ko-KR').format(price ?? 0);
}

function getTimeRemaining(endDate?: string): string {
  if (!endDate) return '종료';
  const total = new Date(endDate).getTime() - Date.now();
  if (total <= 0) return '종료';
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}일 ${hours}시간`;
  return `${hours}시간`;
}

function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Link href={`/auctions/${auction.auctionId}`}>
      <div className="card cursor-pointer group hover:border-[#333] h-full flex flex-col">
        <div className="relative h-48 bg-[#1a1a1a] rounded-t-xl overflow-hidden">
          {auction.thumbnailUrl ? (
            <Image
              src={auction.thumbnailUrl}
              alt={auction.productName ?? ''}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-20">🧱</span>
            </div>
          )}
          <div className={`absolute top-3 left-3 badge ${auction.auctionStatus === 'IN_PROGRESS' ? 'badge-live' : ''}`}>
            {auction.auctionStatus === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>}
            {auction.auctionStatus === 'IN_PROGRESS' ? 'LIVE' : auction.auctionStatus === 'SCHEDULED' ? '예정' : '종료'}
          </div>
        </div>
        <div className="p-4 bg-[#111] rounded-b-xl border-t border-[#1a1a1a] flex-1 flex flex-col justify-between">
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-yellow-400 transition">
            {auction.productName}
          </h3>
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs text-gray-500">현재가</p>
              <p className="text-lg font-bold text-yellow-400">₩{formatPrice(auction.currentPrice)}</p>
            </div>
            <p className="text-sm text-gray-400">{getTimeRemaining(auction.endTime)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [pageInfo, setPageInfo] = useState<PageDto | null>(null); // ✅ 페이지 정보 상태 추가
  const [currentPage, setCurrentPage] = useState(0); // ✅ 현재 페이지 상태 (0부터 시작)
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'ENDED'>('ALL');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const condition = filter === 'ALL' ? {} : { status: filter };

        // ✅ 페이지 번호와 사이즈를 명시적으로 전달
        const res = await api.getAuctions(condition, {
          page: currentPage,
          size: 12
        });

        if (res && res.data && res.data.length > 0) {
          setAuctions(res.data);
          setPageInfo(res.pageDto ?? null); // ✅ 서버에서 준 페이지 정보 저장
        } else {
          setAuctions(MOCK_AUCTIONS);
          setPageInfo(null);
        }
      } catch {
        setAuctions(MOCK_AUCTIONS);
        setPageInfo(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, currentPage]); // ✅ 페이지나 필터가 바뀔 때마다 서버에 요청

  // 필터 변경 시 페이지를 0으로 리셋
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* ... Hero Section 생략 ... */}

      <div className="flex justify-center gap-2 mb-8">
        {(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'ENDED'] as const).map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
          >
            {f === 'ALL' ? '전체' : f === 'IN_PROGRESS' ? '진행 중' : f === 'SCHEDULED' ? '예정' : f === 'ENDED' ? '종료' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-bounce mb-4">🧱</div>
          <p className="text-gray-500">레고 더미를 뒤지는 중...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map(a => (
              <AuctionCard key={a.auctionId} auction={a} />
            ))}
          </div>

          {/* ✅ 페이지네이션 UI 추가 */}
          {pageInfo && pageInfo.totalPages! > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                disabled={!pageInfo.hasPrevious}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                &lt; 이전
              </button>

              {[...Array(pageInfo.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-8 h-8 rounded ${currentPage === i ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={!pageInfo.hasNext}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                다음 &gt;
              </button>
            </div>
          )}

          {auctions.length === 0 && (
            <div className="text-center py-20 text-gray-500">경매가 없습니다.</div>
          )}
        </>
      )}
    </div>
  );
}