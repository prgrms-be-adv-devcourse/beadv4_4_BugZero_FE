'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { components } from '@/api/schema';
import LikeButton from '@/components/LikeButton';
import { useWishlistStore } from '@/store/useWishlistStore';

type Auction = components["schemas"]["AuctionListResponseDto"];
type PageDto = components["schemas"]["PageDto"];

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}


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
    <div className="card cursor-pointer group hover:border-[#333] h-full flex flex-col relative">
      <Link href={`/auctions/${auction.auctionId}`}>
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
      </Link>

      {/* Bookmark Button - Using Shared Component */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <LikeButton
          auctionId={auction.auctionId!}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        />
      </div>

      <Link href={`/auctions/${auction.auctionId}`} className="flex-1 flex flex-col">
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
      </Link>
    </div>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { fetchMyBookmarks } = useWishlistStore();

  // URL에서 상태 읽기
  const filter = (searchParams.get('filter') as 'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'ENDED') || 'ALL';
  const category = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';
  const currentPage = Number(searchParams.get('page')) || 0;

  const [searchTerm, setSearchTerm] = useState(keyword);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [pageInfo, setPageInfo] = useState<PageDto | null>(null);
  const [loading, setLoading] = useState(true);

  // URL 파라미터 업데이트 함수
  const updateUrl = (params: { filter?: string; category?: string; keyword?: string; page?: number }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (params.filter !== undefined) newParams.set('filter', params.filter);
    if (params.category !== undefined) {
      if (params.category) newParams.set('category', params.category);
      else newParams.delete('category'); // Clear if empty
    }
    if (params.keyword !== undefined) {
      if (params.keyword) newParams.set('keyword', params.keyword);
      else newParams.delete('keyword');
    }
    if (params.page !== undefined) newParams.set('page', params.page.toString());

    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setSearchTerm(keyword);
  }, [keyword]);

  // Load Bookmarks on mount
  useEffect(() => {
    fetchMyBookmarks();
  }, [fetchMyBookmarks]);

  // Load Auctions
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const condition: components["schemas"]["AuctionSearchCondition"] = {};
        if (filter !== 'ALL') condition.status = filter;
        if (category) condition.category = category;
        if (keyword) condition.keyword = keyword;

        const res = await api.getAuctions(condition, {
          page: currentPage,
          size: 12
        });

        if (res && res.data) {
          setAuctions(res.data);
          setPageInfo(res.pageDto ?? null);
        } else {
          setAuctions([]);
          setPageInfo(null);
        }
      } catch (error) {
        console.error("API Fetch Error:", error);
        setAuctions(MOCK_AUCTIONS.filter(a => {
          const matchFilter = filter === 'ALL' || a.auctionStatus === filter;
          const matchCategory = !category || true; // Mock doesn't have category field properly populated to check
          const matchKeyword = !keyword || a.productName?.includes(keyword);
          return matchFilter && matchCategory && matchKeyword;
        }));
        setPageInfo(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, category, keyword, currentPage]);

  const handleSearchKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateUrl({ keyword: searchTerm, page: 0 }); // Reset page on search
    }
  };

  const handleSearchClick = () => {
    updateUrl({ keyword: searchTerm, page: 0 });
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    updateUrl({ filter: newFilter, page: 0 });
  };

  const handleCategoryChange = (newCategory: string) => {
    const val = newCategory === 'ALL' ? '' : newCategory;
    updateUrl({ category: val, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Search & Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeys}
              placeholder="상품명 검색..."
              className="w-full bg-[#111] border border-[#333] rounded-full py-3 pl-5 pr-12 focus:border-yellow-500 focus:outline-none transition-colors text-white"
            />
            <button
              onClick={handleSearchClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(['ALL', '스타워즈', '오리지널', '해리포터'] as const).map(c => {
            const isActive = c === 'ALL' ? !category : category === c;
            return (
              <button
                key={c}
                onClick={() => handleCategoryChange(c)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${isActive
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-transparent text-gray-400 border-[#333] hover:border-gray-500'
                  }`}
              >
                {c === 'ALL' ? '전체 카테고리' : c}
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex justify-center gap-2 pt-2 border-t border-[#1a1a1a] w-fit mx-auto px-6">
          {(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'ENDED'] as const).map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`text-sm font-medium transition-all px-2 py-1 ${filter === f ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {f === 'ALL' ? '전체 상태' : f === 'IN_PROGRESS' ? '진행 중' : f === 'SCHEDULED' ? '예정' : f === 'ENDED' ? '종료' : f}
            </button>
          ))}
        </div>
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
              <AuctionCard
                key={a.auctionId}
                auction={a}
              />
            ))}
          </div>

          {/* Pagination */}
          {pageInfo && pageInfo.totalPages! > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                disabled={!pageInfo.hasPrevious}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                &lt; 이전
              </button>

              {[...Array(pageInfo.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-8 h-8 rounded ${currentPage === i ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={!pageInfo.hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
