'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Auction, BidLog } from '@/lib/api';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function AuctionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const auctionId = Number(params.id);

    const [auction, setAuction] = useState<Auction | null>(null);
    const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidding, setBidding] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // 경매 정보 로드 (mock)
                const auctions = await api.getAuctions();
                const found = auctions.find(a => a.id === auctionId);
                setAuction(found || null);

                // 입찰 기록 로드
                // const logs = await api.getBidLogs(auctionId);
                // setBidLogs(logs);

                // Mock bid logs
                setBidLogs([
                    { id: 1, bidderId: 5, bidderNickname: '레고덕후', bidAmount: 1250000, createdAt: '2026-01-20T11:30:00' },
                    { id: 2, bidderId: 3, bidderNickname: '브릭마스터', bidAmount: 1200000, createdAt: '2026-01-20T10:45:00' },
                    { id: 3, bidderId: 8, bidderNickname: '미니피규어', bidAmount: 1100000, createdAt: '2026-01-19T22:10:00' },
                    { id: 4, bidderId: 2, bidderNickname: '레고왕', bidAmount: 1000000, createdAt: '2026-01-19T18:30:00' },
                    { id: 5, bidderId: 7, bidderNickname: '테크닉러버', bidAmount: 900000, createdAt: '2026-01-19T14:20:00' },
                ]);
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [auctionId]);

    const handleBid = async () => {
        if (!bidAmount || !auction) return;

        const amount = Number(bidAmount);
        if (amount <= auction.currentPrice) {
            alert('현재가보다 높은 금액을 입력해주세요!');
            return;
        }

        setBidding(true);
        try {
            // await api.createBid(auctionId, amount);
            alert('입찰 완료! (데모 모드)');
            // Simulate successful bid
            setAuction(prev => prev ? { ...prev, currentPrice: amount, bidCount: prev.bidCount + 1 } : null);
            setBidLogs(prev => [{
                id: Date.now(),
                bidderId: 1,
                bidderNickname: '나',
                bidAmount: amount,
                createdAt: new Date().toISOString()
            }, ...prev]);
            setBidAmount('');
        } catch (error) {
            alert('입찰 실패');
        } finally {
            setBidding(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl animate-bounce">🧱</div>
                <p className="text-gray-400 mt-4">로딩 중...</p>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="text-center py-20">
                <p className="text-6xl mb-4">😢</p>
                <p className="text-gray-400 mb-4">경매를 찾을 수 없습니다</p>
                <Link href="/" className="text-yellow-400 hover:underline">
                    ← 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* 뒤로가기 */}
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 목록으로
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 왼쪽: 이미지 & 설명 */}
                <div>
                    <div className="lego-card overflow-hidden mb-6">
                        <div className="h-80 bg-gray-700">
                            {auction.imageUrl ? (
                                <img
                                    src={auction.imageUrl}
                                    alt={auction.productName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-8xl">
                                    🧱
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-yellow-400">상품 설명</h2>
                        <p className="text-gray-300 leading-relaxed">
                            {auction.productDescription}
                        </p>
                    </div>
                </div>

                {/* 오른쪽: 경매 정보 */}
                <div>
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            {auction.status === 'ACTIVE' && (
                                <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 bg-white rounded-full pulse-live"></span>
                                    진행 중
                                </span>
                            )}
                            <span className="text-gray-400 text-sm">
                                입찰 {auction.bidCount}회
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-6">
                            {auction.productName}
                        </h1>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-900 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">시작가</p>
                                <p className="text-lg font-bold text-gray-400">
                                    ₩{formatPrice(auction.startPrice)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-lg p-4 border border-yellow-500/50">
                                <p className="text-xs text-yellow-400 mb-1">현재가</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    ₩{formatPrice(auction.currentPrice)}
                                </p>
                            </div>
                        </div>

                        {/* 입찰 폼 */}
                        {auction.status === 'ACTIVE' && (
                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">입찰 금액</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder={`최소 ${formatPrice(auction.currentPrice + 10000)}원`}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                    />
                                    <button
                                        onClick={handleBid}
                                        disabled={bidding}
                                        className="lego-btn text-black font-bold px-6 disabled:opacity-50"
                                    >
                                        {bidding ? '입찰 중...' : '입찰하기'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 text-sm text-gray-400">
                            <div>
                                <span className="text-gray-500">시작:</span> {formatDate(auction.startedAt)}
                            </div>
                            <div>
                                <span className="text-gray-500">종료:</span> {formatDate(auction.endedAt)}
                            </div>
                        </div>
                    </div>

                    {/* 입찰 기록 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-yellow-400">
                            입찰 기록
                        </h2>

                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {bidLogs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-gray-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {index === 0 ? '👑' : '🧱'}
                                        </span>
                                        <div>
                                            <p className={`font-medium ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                                {log.bidderNickname}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                        ₩{formatPrice(log.bidAmount)}
                                    </p>
                                </div>
                            ))}

                            {bidLogs.length === 0 && (
                                <p className="text-center text-gray-500 py-8">
                                    아직 입찰이 없습니다. 첫 번째 입찰자가 되어보세요!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
