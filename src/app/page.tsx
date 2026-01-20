'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Auction } from '@/lib/api';

// 남은 시간 계산 함수
function getTimeRemaining(endDate: string): string {
  const total = new Date(endDate).getTime() - new Date().getTime();
  if (total <= 0) return '종료됨';

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

// 가격 포맷팅
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

// 경매 카드 컴포넌트
function AuctionCard({ auction }: { auction: Auction }) {
  const statusColors = {
    PENDING: 'bg-gray-500',
    ACTIVE: 'bg-green-500',
    ENDED: 'bg-red-500'
  };

  const statusText = {
    PENDING: '예정',
    ACTIVE: '진행 중',
    ENDED: '종료'
  };

  return (
    <Link href={`/auctions/${auction.id}`}>
      <div className="lego-card transition-all duration-300 cursor-pointer group">
        {/* 이미지 */}
        <div className="relative h-48 bg-gray-700 overflow-hidden">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.productName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🧱
            </div>
          )}

          {/* 상태 뱃지 */}
          <div className={`absolute top-3 left-3 ${statusColors[auction.status]} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
            {auction.status === 'ACTIVE' && <span className="w-2 h-2 bg-white rounded-full pulse-live"></span>}
            {statusText[auction.status]}
          </div>

          {/* 입찰 수 */}
          <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-xs">
            🔥 {auction.bidCount}회 입찰
          </div>
        </div>

        {/* 정보 */}
        <div className="p-5">
          <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-yellow-400 transition">
            {auction.productName}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {auction.productDescription}
          </p>

          {/* 가격 정보 */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500">현재가</p>
              <p className="text-2xl font-bold text-yellow-400">
                ₩{formatPrice(auction.currentPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">남은 시간</p>
              <p className={`text-sm font-medium ${auction.status === 'ACTIVE' ? 'text-red-400' : 'text-gray-400'}`}>
                ⏰ {getTimeRemaining(auction.endedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');

  useEffect(() => {
    async function loadAuctions() {
      try {
        const data = await api.getAuctions();
        setAuctions(data);
      } catch (error) {
        console.error('경매 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAuctions();
  }, []);

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'ALL') return true;
    return auction.status === filter;
  });

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">희귀 레고</span>를 경매로
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          한정판, 단종품, 빈티지 레고를 만나보세요
        </p>

        {/* 통계 */}
        <div className="flex justify-center gap-8 text-center">
          <div className="bg-gray-800/50 rounded-2xl px-8 py-4 border border-yellow-500/30">
            <p className="text-3xl font-bold text-yellow-400">{auctions.filter(a => a.status === 'ACTIVE').length}</p>
            <p className="text-sm text-gray-400">진행 중인 경매</p>
          </div>
          <div className="bg-gray-800/50 rounded-2xl px-8 py-4 border border-red-500/30">
            <p className="text-3xl font-bold text-red-400">{auctions.reduce((sum, a) => sum + a.bidCount, 0)}</p>
            <p className="text-sm text-gray-400">총 입찰 수</p>
          </div>
        </div>
      </section>

      {/* 필터 버튼 */}
      <div className="flex justify-center gap-4 mb-8">
        {(['ALL', 'ACTIVE', 'ENDED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full font-medium transition ${filter === f
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '진행 중' : '종료'}
          </button>
        ))}
      </div>

      {/* 경매 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="text-6xl animate-bounce">🧱</div>
          <p className="text-gray-400 mt-4">경매를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}

      {!loading && filteredAuctions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">😢</p>
          <p className="text-gray-400">해당 조건의 경매가 없습니다</p>
        </div>
      )}
    </div>
  );
}
