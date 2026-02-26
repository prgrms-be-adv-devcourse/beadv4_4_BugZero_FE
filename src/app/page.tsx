'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { components } from '@/api/schema';
import LikeButton from '@/components/LikeButton';
import { useWishlistStore } from '@/store/useWishlistStore';
import { parseDate } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

type Auction = components["schemas"]["AuctionListResponseDto"];
type PageDto = components["schemas"]["PageDto"];

const CATEGORY_MAP: Record<string, components["schemas"]["AuctionSearchCondition"]["category"]> = {
  '스타워즈': 'STARWARS',
  '해리포터': 'HARRYPOTTER',
  '오리지널': 'ORIGINAL',
  '테크닉': 'TECHNIC',
  '아이콘': 'ICONS',
  '아이디어': 'IDEAS',
  '아키텍처': 'ARCHITECTURE',
  '닌자고': 'NINJAGO',
  '시티': 'CITY',
  '기타': 'ETC'
};

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
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
  const total = parseDate(endDate).getTime() - Date.now();
  if (total <= 0) return '종료';
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);
  if (days > 0) return `${days}일 ${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분 ${seconds}초`;
}

function AuctionCard({ auction }: { auction: Auction }) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(auction.endTime));

  useEffect(() => {
    if (auction.auctionStatus !== 'IN_PROGRESS' && auction.auctionStatus !== 'SCHEDULED') return;
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(auction.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [auction.endTime, auction.auctionStatus]);

  return (
    <div className="card cursor-pointer group hover:border-border h-full flex flex-col relative">
      <Link href={`/auctions/${auction.auctionId}`}>
        <div className="relative h-48 bg-card rounded-t-xl overflow-hidden">
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
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-foreground transition-colors"
        />
      </div>

      <Link href={`/auctions/${auction.auctionId}`} className="flex-1 flex flex-col">
        <div className="p-4 bg-card rounded-b-xl border-t border-border flex-1 flex flex-col justify-between">
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-yellow-400 transition">
            {auction.productName}
          </h3>
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs text-muted">현재가</p>
              <p className="text-lg font-bold text-yellow-400">₩{formatPrice(auction.currentPrice)}</p>
            </div>
            <p className="text-sm text-muted">{timeLeft}</p>
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
  const { isLoggedIn, role } = useAuthStore();

  // URL에서 상태 읽기
  const filter = (searchParams.get('filter') as 'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'ENDED') || 'ALL';
  const category = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';
  const sort = (searchParams.get('sort') as 'NEWEST' | 'CLOSING_SOON') || 'NEWEST';
  const currentPage = Number(searchParams.get('page')) || 0;

  const [searchTerm, setSearchTerm] = useState(keyword);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [pageInfo, setPageInfo] = useState<PageDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Category scroll state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  // URL 파라미터 업데이트 함수
  const updateUrl = (params: { filter?: string; category?: string; keyword?: string; page?: number; sort?: string }) => {
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
    if (params.sort !== undefined) {
      if (params.sort === 'NEWEST') newParams.delete('sort');
      else newParams.set('sort', params.sort);
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

  const handleBannerClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast.error('판매 등록은 로그인 후 이용 가능합니다.');
      router.push('/login');
    }
  };

  // Load Auctions
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const condition: components["schemas"]["AuctionSearchCondition"] = {};
        if (filter !== 'ALL') condition.status = filter;
        if (category && CATEGORY_MAP[category]) {
          condition.category = CATEGORY_MAP[category];
        }
        if (keyword) condition.keyword = keyword;
        if (sort === 'CLOSING_SOON') condition.sort = 'CLOSING_SOON';
        // if NEWEST, we don't set it (default)

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

        const filtered = MOCK_AUCTIONS.filter(a => {
          const matchFilter = filter === 'ALL' || a.auctionStatus === filter;
          const matchCategory = !category || true;
          const matchKeyword = !keyword || a.productName?.includes(keyword);
          return matchFilter && matchCategory && matchKeyword;
        });

        if (sort === 'CLOSING_SOON') {
          filtered.sort((a, b) => parseDate(a.endTime || '').getTime() - parseDate(b.endTime || '').getTime());
        } else {
          // NEWEST logic (Mock doesn't have createdAt, so just ID reverse for now)
          filtered.sort((a, b) => (b.auctionId || 0) - (a.auctionId || 0));
        }

        setAuctions(filtered);
        setPageInfo(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, category, keyword, sort, currentPage]);

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

  const handleSortChange = (newSort: string) => {
    updateUrl({ sort: newSort, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Seller Registration Banner */}
      {role !== 'SELLER' && (
        <div className="mb-12 rounded-[2.5rem] overflow-hidden relative bg-gradient-to-br from-gray-900 via-[#111] to-black border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center justify-between p-8 md:p-14 mx-4 xl:mx-auto max-w-7xl group">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-white/30 rounded-full blur-[1px]"></div>
            <div className="absolute top-[60%] left-[30%] w-3 h-3 bg-yellow-500/20 rounded-full blur-[2px]"></div>
            <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-white/40 rounded-full blur-[1px]"></div>
            <div className="absolute bottom-[20%] right-[30%] w-4 h-4 bg-yellow-500/10 rounded-full blur-[3px]"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 group-hover:opacity-70"></div>
          </div>

          <div className="flex-1 z-10 text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">잠자고 있는 레고,<br className="hidden md:block" /> 가치를 알아볼 시간입니다.</h2>
            <p className="text-gray-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0 mb-8 leading-relaxed">
              소중히 간직했던 희귀 레고를 경매에 등록하고 새로운 주인을 찾아주세요.<br className="hidden md:block" />안전하고 편리한 RareGo만의 판매자 전용 시스템이 함께합니다.
            </p>
            <Link
              href="/seller/onboarding"
              onClick={handleBannerClick}
              className="inline-block bg-yellow-500 text-black px-8 py-4 rounded-xl font-black text-lg hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all active:scale-[0.98]">
              판매자 등록하기 &gt;
            </Link>
          </div>

          <div className="z-10 flex-shrink-0 relative mt-4 md:mt-0">
            <div className="absolute inset-0 bg-yellow-500/15 blur-3xl rounded-full"></div>
            <Image
              src="/images/banner/seller_banner.png"
              alt="Seller Lego"
              width={340}
              height={340}
              className="relative z-10 drop-shadow-2xl hover:scale-105 hover:-rotate-2 transition-transform duration-500 select-none object-contain"
            />
          </div>
        </div>
      )}

      {/* Search & Filter Section */}
      <div className="mb-10 space-y-6">
        {/* Search Bar */}
        <div className="flex justify-center px-4">
          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-xl group-focus-within:bg-yellow-500/10 transition-colors duration-300"></div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeys}
              placeholder="찾으시는 레고가 있나요?"
              className="relative w-full bg-card/80 backdrop-blur-lg border border-border/50 rounded-full py-4 pl-6 pr-14 shadow-lg focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 focus:outline-none transition-all text-foreground text-lg placeholder:text-muted/70"
            />
            <button
              onClick={handleSearchClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-yellow-500 transition-colors z-10"
            >
              <SearchIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="relative w-full max-w-5xl mx-auto px-8 group/cat">
          {/* Scroll fade gradients */}
          <div className={`absolute left-8 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className={`absolute right-8 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Left Arrow */}
          <button
            onClick={() => scrollCategories('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-full shadow-md border border-border transition-all duration-300 hover:bg-yellow-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${showLeftArrow ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
            aria-label="이전 카테고리"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCategories('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-card text-foreground rounded-full shadow-md border border-border transition-all duration-300 hover:bg-yellow-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${showRightArrow ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
            aria-label="다음 카테고리"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div
            ref={categoryScrollRef}
            onScroll={handleScroll}
            className="flex items-center gap-3 overflow-x-auto whitespace-nowrap py-2 px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x scroll-smooth"
          >
            {(['ALL', ...Object.keys(CATEGORY_MAP)]).map(c => {
              const isActive = c === 'ALL' ? !category : category === c;
              return (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`snap-center shrink-0 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${isActive
                    ? 'bg-foreground text-background border-foreground shadow-[0_0_15px_rgba(255,255,255,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'bg-card/50 text-muted border-border/50 hover:bg-card hover:border-foreground/30 hover:text-foreground'
                    }`}
                >
                  {c === 'ALL' ? '전체 카테고리' : c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter & Sort */}
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-border/40 w-fit mx-auto px-8">
          <div className="flex gap-4">
            {(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'ENDED'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`text-sm font-semibold transition-colors py-1 relative ${filter === f ? 'text-yellow-500' : 'text-muted hover:text-foreground/80'
                  }`}
              >
                {f === 'ALL' ? '전체 상태' : f === 'IN_PROGRESS' ? '진행 중' : f === 'SCHEDULED' ? '예정' : f === 'ENDED' ? '종료' : f}
                {filter === f && (
                  <span className="absolute -bottom-2.5 flex w-full justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border/60"></div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSortChange('NEWEST')}
              className={`text-sm font-semibold transition-colors py-1 ${sort === 'NEWEST' ? 'text-foreground' : 'text-muted hover:text-foreground/80'}`}
            >
              최신순
            </button>
            <button
              onClick={() => handleSortChange('CLOSING_SOON')}
              className={`text-sm font-semibold transition-colors py-1 ${sort === 'CLOSING_SOON' ? 'text-foreground' : 'text-muted hover:text-foreground/80'}`}
            >
              마감임박순
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-bounce mb-4">🧱</div>
          <p className="text-muted">레고 더미를 뒤지는 중...</p>
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
                className="p-2 text-muted hover:text-foreground disabled:opacity-30"
              >
                &lt; 이전
              </button>

              {[...Array(pageInfo.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-8 h-8 rounded ${currentPage === i ? 'bg-yellow-500 text-black font-bold' : 'bg-card text-muted'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={!pageInfo.hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 text-muted hover:text-foreground disabled:opacity-30"
              >
                다음 &gt;
              </button>
            </div>
          )}

          {auctions.length === 0 && (
            <div className="text-center py-20 text-muted">경매가 없습니다.</div>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
