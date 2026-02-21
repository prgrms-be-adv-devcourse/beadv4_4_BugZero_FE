'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, MySale } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';


type AuctionResultTab = 'won' | 'lost' | 'failed';

interface AuctionResult {
    id: number;
    productName: string;
    imageUrl: string;
    finalPrice: number;
    myBidAmount: number;
    endTime: string;
    status: 'WON' | 'LOST' | 'FAILED';
    paymentStatus?: 'PENDING' | 'PAID' | 'EXPIRED';
    paymentDeadline?: string;
}

const mockResults: AuctionResult[] = [
    {
        id: 1,
        productName: '레고 스타워즈 밀레니엄 팔콘 75192',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400',
        finalPrice: 1250000,
        myBidAmount: 1250000,
        endTime: '2026-01-20T22:00:00',
        status: 'WON',
        paymentStatus: 'PENDING',
        paymentDeadline: '2026-01-21T22:00:00',
    },
    {
        id: 2,
        productName: '레고 테크닉 포르쉐 911 GT3 RS',
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
        finalPrice: 520000,
        myBidAmount: 480000,
        endTime: '2026-01-19T20:00:00',
        status: 'LOST',
    },
    {
        id: 3,
        productName: '레고 해리포터 호그와트 성',
        imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400',
        finalPrice: 780000,
        myBidAmount: 780000,
        endTime: '2026-01-18T21:00:00',
        status: 'WON',
        paymentStatus: 'PAID',
    },
];

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTimeRemaining(deadline: string): { text: string; urgent: boolean } {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return { text: '만료됨', urgent: true };

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours < 24) return { text: `${hours}시간 남음`, urgent: true };
    return { text: `${Math.floor(hours / 24)}일 남음`, urgent: false };
}

export default function AuctionResultsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AuctionResultTab>('won');

    // Failed Auctions State
    const [failedAuctions, setFailedAuctions] = useState<MySale[]>([]);
    const [isLoadingFailed, setIsLoadingFailed] = useState(false);

    // Relist Modal State
    const [relistAuctionId, setRelistAuctionId] = useState<number | null>(null);
    const [relistForm, setRelistForm] = useState({
        startPrice: '',
        tickSize: '',
        durationDays: '3'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Failed Auctions
    const fetchFailedAuctions = async () => {
        setIsLoadingFailed(true);
        try {
            const res = await api.getMySales('COMPLETED', { page: 0, size: 100 });
            if (res.data) {
                // Filter for failed sales. Either tradeStatus is FAILED or it ENDED with 0 bids.
                const failed = res.data.filter(sale =>
                    sale.tradeStatus === 'FAILED' ||
                    (sale.auctionStatus === 'ENDED' && sale.bidCount === 0)
                );
                setFailedAuctions(failed);
            }
        } catch (error) {
            console.error('Failed to load failed auctions', error);
        } finally {
            setIsLoadingFailed(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'failed') {
            fetchFailedAuctions();
        }
    }, [activeTab]);

    const handleWithdraw = async (auctionId: number) => {
        if (!confirm('정말 삭제(판매 포기) 하시겠습니까? 복구할 수 없습니다.')) return;

        try {
            await api.withdrawAuction(auctionId);
            toast.success('판매가 취소되었습니다.');
            setFailedAuctions(prev => prev.filter(a => a.auctionId !== auctionId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '판매 취소에 실패했습니다.');
        }
    };

    const submitRelist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!relistAuctionId) return;

        setIsSubmitting(true);
        try {
            await api.relistAuction(relistAuctionId, {
                startPrice: Number(relistForm.startPrice),
                tickSize: Number(relistForm.tickSize),
                durationDays: Number(relistForm.durationDays)
            });
            toast.success('경매가 재등록되었습니다.');
            setRelistAuctionId(null);
            fetchFailedAuctions();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '재등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const wonAuctions = mockResults.filter(r => r.status === 'WON');
    const lostAuctions = mockResults.filter(r => r.status === 'LOST');

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <Link href="/mypage" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 마이페이지
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">경매 결과</h1>
            <p className="text-gray-400 mb-8">참여했던 경매의 최종 결과를 확인하세요</p>

            {/* 탭 */}
            <div className="flex gap-2 mb-8">
                {[
                    { key: 'won' as const, label: '낙찰', icon: '🏆', count: wonAuctions.length },
                    { key: 'lost' as const, label: '패찰', icon: '😢', count: lostAuctions.length },
                    { key: 'failed' as const, label: '유찰 (판매자)', icon: '💔', count: activeTab === 'failed' ? failedAuctions.length : '?' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.key
                            ? 'bg-gradient-to-r from-yellow-500 to-red-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-700'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* 낙찰 목록 */}
            {activeTab === 'won' && (
                <div className="space-y-4">
                    {wonAuctions.map((auction) => {
                        const deadline = auction.paymentDeadline ? getTimeRemaining(auction.paymentDeadline) : null;

                        return (
                            <div key={auction.id} className="lego-card p-5">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                        <Image src={auction.imageUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-white">{auction.productName}</h3>
                                            {auction.paymentStatus === 'PENDING' && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${deadline?.urgent ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 text-black'
                                                    }`}>
                                                    결제 대기
                                                </span>
                                            )}
                                            {auction.paymentStatus === 'PAID' && (
                                                <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold">
                                                    결제 완료
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-2xl font-bold text-yellow-400 mb-3">
                                            ₩{formatPrice(auction.finalPrice)}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500">
                                                종료: {formatDate(auction.endTime)}
                                            </p>

                                            {auction.paymentStatus === 'PENDING' && deadline && (
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm ${deadline.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                                                        ⏰ {deadline.text}
                                                    </span>
                                                    <Link
                                                        href={`/payment/auction/${auction.id}`}
                                                        className="lego-btn text-sm py-2 px-4 text-black"
                                                    >
                                                        결제하기
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {wonAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">🏆</p>
                            <p className="text-gray-400">아직 낙찰 내역이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 패찰 목록 */}
            {activeTab === 'lost' && (
                <div className="space-y-4">
                    {lostAuctions.map((auction) => (
                        <div key={auction.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 opacity-75">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 grayscale">
                                    <Image src={auction.imageUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-400 mb-2">{auction.productName}</h3>

                                    <div className="flex gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">최종 낙찰가</p>
                                            <p className="text-lg font-bold text-gray-400">
                                                ₩{formatPrice(auction.finalPrice)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">내 입찰가</p>
                                            <p className="text-lg font-bold text-red-400">
                                                ₩{formatPrice(auction.myBidAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">차액</p>
                                            <p className="text-lg font-bold text-red-400">
                                                -₩{formatPrice(auction.finalPrice - auction.myBidAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500">
                                        종료: {formatDate(auction.endTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {lostAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">🎯</p>
                            <p className="text-gray-400">패찰 내역이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 유찰 목록 (판매자용) */}
            {activeTab === 'failed' && (
                <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                        <p className="text-yellow-400 text-sm">
                            💡 유찰된 상품은 재등록하여 다시 경매를 진행할 수 있습니다.
                        </p>
                    </div>

                    {isLoadingFailed ? (
                        <div className="text-center py-16">
                            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-400">불러오는 중...</p>
                        </div>
                    ) : failedAuctions.map((auction) => (
                        <div key={auction.auctionId} className="bg-gray-800 rounded-xl p-5 border border-red-500/30">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                    <Image src={auction.thumbnailUrl || '/images/placeholder.png'} alt={auction.title || '상품 이미지'} width={96} height={96} className="w-full h-full object-cover opacity-50" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white">{auction.title}</h3>
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2">
                                            유찰
                                        </span>
                                    </div>

                                    <p className="text-gray-400 mb-3 text-sm">
                                        종료 가격: <span className="text-white">₩{formatPrice(auction.currentPrice || 0)}</span>
                                    </p>

                                    <p className="text-sm text-red-400 mb-3">
                                        {auction.bidCount === 0 ? '❌ 입찰자 없음' : '❌ 낙찰자 결제 기한 만료 등 취소됨'}
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setRelistForm({
                                                    startPrice: String(auction.currentPrice || 0),
                                                    tickSize: '1000',
                                                    durationDays: '3'
                                                });
                                                setRelistAuctionId(auction.auctionId || null);
                                            }}
                                            className="lego-btn text-sm py-2 px-4 text-black"
                                        >
                                            🔄 재등록하기
                                        </button>
                                        <button
                                            onClick={() => handleWithdraw(auction.auctionId || 0)}
                                            className="bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition"
                                        >
                                            삭제하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!isLoadingFailed && failedAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">✅</p>
                            <p className="text-gray-400">유찰된 경매가 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* Relist Modal */}
            {relistAuctionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h2 className="text-xl font-bold text-white">경매 재등록</h2>
                            <button onClick={() => setRelistAuctionId(null)} className="text-gray-400 hover:text-white p-1">✕</button>
                        </div>
                        <form onSubmit={submitRelist} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">새 시작가 (₩)</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    placeholder="예: 10000"
                                    className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-white"
                                    value={relistForm.startPrice}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, startPrice: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">입찰 단위 (₩)</label>
                                <input
                                    type="number"
                                    required
                                    min={100}
                                    placeholder="예: 1000"
                                    className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-white"
                                    value={relistForm.tickSize}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, tickSize: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">진행 기간 (일)</label>
                                <select
                                    required
                                    className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-white"
                                    value={relistForm.durationDays}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, durationDays: e.target.value }))}
                                >
                                    <option value="1">1일</option>
                                    <option value="3">3일</option>
                                    <option value="5">5일</option>
                                    <option value="7">7일</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setRelistAuctionId(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">취소</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50">
                                    {isSubmitting ? '처리중...' : '재등록 시작하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
