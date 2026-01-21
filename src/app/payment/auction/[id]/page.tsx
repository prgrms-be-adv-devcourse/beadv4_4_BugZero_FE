'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';


function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

export default function AuctionPaymentPage() {
    const params = useParams();
    const auctionId = params.id;


    const [step, setStep] = useState<'confirm' | 'processing' | 'complete'>('confirm');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'toss'>('wallet');
    const [loading, setLoading] = useState(false);

    // Mock auction data
    const auction = {
        id: auctionId,
        productName: '레고 스타워즈 밀레니엄 팔콘 75192',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400',
        finalPrice: 1250000,
        deposit: 125000,
        remainingAmount: 1125000,
        paymentDeadline: '2026-01-21T22:00:00',
    };

    const walletBalance = 500000;
    const insufficientBalance = walletBalance < auction.remainingAmount;

    const handlePayment = async () => {
        setLoading(true);
        setStep('processing');

        try {
            // Simulate payment process
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (paymentMethod === 'toss') {
                // TODO: 실제 토스페이먼츠 SDK 연동
                alert('토스페이먼츠 결제창으로 이동합니다 (데모)');
            }

            setStep('complete');
        } catch {
            alert('결제 실패');

            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/auction-results" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 경매 결과
            </Link>

            {/* 결제 확인 단계 */}
            {step === 'confirm' && (
                <>
                    <h1 className="text-3xl font-bold text-white mb-2">낙찰 결제</h1>
                    <p className="text-gray-400 mb-8">축하합니다! 낙찰금을 결제해주세요</p>

                    {/* 상품 정보 */}
                    <div className="lego-card p-6 mb-6">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700">
                                <Image src={auction.imageUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
                            </div>

                            <div>
                                <h2 className="font-bold text-white text-lg mb-2">{auction.productName}</h2>
                                <p className="text-3xl font-bold text-yellow-400">
                                    ₩{formatPrice(auction.finalPrice)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 결제 상세 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                        <h3 className="font-bold text-white mb-4">결제 상세</h3>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400">낙찰가</span>
                                <span className="text-white">₩{formatPrice(auction.finalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-green-400">
                                <span>입찰 보증금 차감</span>
                                <span>-₩{formatPrice(auction.deposit)}</span>
                            </div>
                            <div className="h-px bg-gray-700"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-white">최종 결제 금액</span>
                                <span className="text-yellow-400">₩{formatPrice(auction.remainingAmount)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">결제 기한</span>
                                <span className="text-red-400 font-medium">
                                    {new Date(auction.paymentDeadline).toLocaleString('ko-KR')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 결제 수단 선택 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                        <h3 className="font-bold text-white mb-4">결제 수단</h3>

                        <div className="space-y-3">
                            {/* 지갑 결제 */}
                            <button
                                onClick={() => setPaymentMethod('wallet')}
                                disabled={insufficientBalance}
                                className={`w-full p-4 rounded-xl text-left transition flex items-center justify-between ${paymentMethod === 'wallet'
                                    ? 'bg-yellow-500/20 border-2 border-yellow-500'
                                    : insufficientBalance
                                        ? 'bg-gray-900 border-2 border-transparent opacity-50 cursor-not-allowed'
                                        : 'bg-gray-900 border-2 border-transparent hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className={`font-medium ${paymentMethod === 'wallet' ? 'text-yellow-400' : 'text-white'}`}>
                                            지갑 잔액
                                        </p>
                                        <p className={`text-sm ${insufficientBalance ? 'text-red-400' : 'text-gray-500'}`}>
                                            현재 잔액: ₩{formatPrice(walletBalance)}
                                            {insufficientBalance && ' (잔액 부족)'}
                                        </p>
                                    </div>
                                </div>
                                {paymentMethod === 'wallet' && <span className="text-yellow-400 text-xl">✓</span>}
                            </button>

                            {/* 토스페이 */}
                            <button
                                onClick={() => setPaymentMethod('toss')}
                                className={`w-full p-4 rounded-xl text-left transition flex items-center justify-between ${paymentMethod === 'toss'
                                    ? 'bg-blue-500/20 border-2 border-blue-500'
                                    : 'bg-gray-900 border-2 border-transparent hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">💳</span>
                                    <div>
                                        <p className={`font-medium ${paymentMethod === 'toss' ? 'text-blue-400' : 'text-white'}`}>
                                            토스페이먼츠
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            카드, 계좌이체, 간편결제
                                        </p>
                                    </div>
                                </div>
                                {paymentMethod === 'toss' && <span className="text-blue-400 text-xl">✓</span>}
                            </button>
                        </div>
                    </div>

                    {/* 결제 버튼 */}
                    <button
                        onClick={handlePayment}
                        disabled={loading || (paymentMethod === 'wallet' && insufficientBalance)}
                        className="w-full lego-btn py-4 text-black text-xl font-bold disabled:opacity-50"
                    >
                        ₩{formatPrice(auction.remainingAmount)} 결제하기
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        결제 진행 시 이용약관에 동의한 것으로 간주됩니다
                    </p>
                </>
            )}

            {/* 처리 중 */}
            {step === 'processing' && (
                <div className="text-center py-20">
                    <div className="text-6xl animate-bounce mb-6">💳</div>
                    <h2 className="text-2xl font-bold text-white mb-2">결제 처리 중...</h2>
                    <p className="text-gray-400">잠시만 기다려주세요</p>
                </div>
            )}

            {/* 결제 완료 */}
            {step === 'complete' && (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">✓</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">결제 완료!</h2>
                    <p className="text-gray-400 mb-4">
                        {auction.productName} 구매가 완료되었습니다
                    </p>
                    <p className="text-2xl font-bold text-yellow-400 mb-8">
                        ₩{formatPrice(auction.finalPrice)}
                    </p>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8 text-left max-w-md mx-auto">
                        <h3 className="font-bold text-white mb-4">배송 안내</h3>
                        <p className="text-gray-400 text-sm">
                            판매자가 상품을 발송하면 배송 정보가 업데이트됩니다.
                            보통 결제 완료 후 2-3일 내에 발송됩니다.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/mypage"
                            className="bg-gray-700 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-600 transition"
                        >
                            마이페이지
                        </Link>
                        <Link
                            href="/"
                            className="lego-btn py-3 px-6 text-black font-medium"
                        >
                            경매 더보기
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
