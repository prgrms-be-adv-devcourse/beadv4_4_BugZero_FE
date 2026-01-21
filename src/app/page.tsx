'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, Auction } from '@/lib/api';


function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

function getTimeRemaining(endDate: string): string {
  const total = new Date(endDate).getTime() - Date.now();
  if (total <= 0) return '종료';
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}일 ${hours}시간`;
  return `${hours}시간`;
}

function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Link href={`/auctions/${auction.id}`}>
      <div className="card cursor-pointer group hover:border-[#333]">
        <div className="relative h-48 bg-[#1a1a1a]">
          {auction.imageUrl ? (
            <Image src={auction.imageUrl} alt="" width={400} height={192} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🧱</span>
            </div>
          )}
          <div className={`absolute top-3 left-3 badge ${auction.status === 'IN_PROGRESS' ? 'badge-live' : ''}`}>
            {auction.status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>}
            {auction.status === 'IN_PROGRESS' ? 'LIVE' : auction.status === 'SCHEDULED' ? '예정' : '종료'}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-[var(--lego-yellow)] transition">{auction.productName}</h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-1">{auction.productDescription}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500">현재가</p>
              <p className="text-lg font-bold text-[var(--lego-yellow)]">₩{formatPrice(auction.currentPrice)}</p>
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'ENDED'>('ALL');

  useEffect(() => {
    async function load() {
      const data = await api.getAuctions();
      setAuctions(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = auctions.filter(a => filter === 'ALL' || a.status === filter);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 relative">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient">희귀 레고</span>
            <span className="text-white">를 경매로</span>
          </h1>
          <p className="text-gray-400 text-lg">한정판 · 단종품 · 빈티지 레고를 만나보세요</p>
        </div>
      </section>

      {/* Filter */}
      <div className="flex justify-center gap-2 mb-8">
        {(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'ENDED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
          >
            {f === 'ALL' ? '전체' : f === 'IN_PROGRESS' ? '진행 중' : f === 'SCHEDULED' ? '예정' : '종료'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-bounce mb-4">🧱</div>
          <p className="text-gray-500 mt-4">불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(a => <AuctionCard key={a.id} auction={a} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">해당 조건의 경매가 없습니다</div>
      )}
    </div>
  );
}
