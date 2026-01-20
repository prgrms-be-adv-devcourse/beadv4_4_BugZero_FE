'use client';

import { useState } from 'react';
import Link from 'next/link';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

export default function PaymentPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [walletBalance] = useState(500000); // Mock balance

    const presetAmounts = [10000, 50000, 100000, 500000];

    const handleCharge = async () => {
        if (!amount || Number(amount) <= 0) {
            alert('충전 금액을 입력해주세요');
            return;
        }

        setLoading(true);
        try {
            // TODO: 실제 토스페이먼츠 결제 연동
            // const response = await api.requestPayment(memberId, Number(amount));
            // 토스 결제창 호출

            alert(`₩${formatPrice(Number(amount))} 충전 요청! (데모 모드)`);
            setAmount('');
        } catch (error) {
            alert('충전 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 경매 목록으로
            </Link>

            {/* 현재 잔액 */}
            <div className="lego-card p-8 mb-8 text-center">
                <p className="text-gray-400 mb-2">내 지갑 잔액</p>
                <p className="text-5xl font-bold text-yellow-400 mb-2">
                    ₩{formatPrice(walletBalance)}
                </p>
                <p className="text-sm text-gray-500">
                    레고 입찰에 사용할 수 있어요!
                </p>
            </div>

            {/* 충전하기 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
                <h2 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                    💰 지갑 충전
                </h2>

                {/* 빠른 선택 버튼 */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {presetAmounts.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setAmount(String(preset))}
                            className={`py-3 rounded-lg font-medium transition ${amount === String(preset)
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                        >
                            {formatPrice(preset)}원
                        </button>
                    ))}
                </div>

                {/* 직접 입력 */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">충전 금액 직접 입력</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="금액 입력"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-4 text-white text-xl focus:outline-none focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* 충전 버튼 */}
                <button
                    onClick={handleCharge}
                    disabled={loading || !amount}
                    className="w-full lego-btn text-black text-xl py-4 disabled:opacity-50"
                >
                    {loading ? '처리 중...' : `₩${amount ? formatPrice(Number(amount)) : 0} 충전하기`}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                    토스페이먼츠를 통해 안전하게 결제됩니다
                </p>
            </div>

            {/* 최근 거래 내역 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">
                    📋 최근 거래 내역
                </h2>

                <div className="space-y-3">
                    {[
                        { type: '충전', amount: 100000, date: '2026-01-20 10:30', positive: true },
                        { type: '입찰 보증금', amount: -50000, date: '2026-01-19 15:20', positive: false },
                        { type: '보증금 환불', amount: 50000, date: '2026-01-18 09:45', positive: true },
                        { type: '낙찰 결제', amount: -350000, date: '2026-01-17 22:10', positive: false },
                    ].map((tx, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center p-4 bg-gray-900 rounded-lg"
                        >
                            <div>
                                <p className="font-medium text-white">{tx.type}</p>
                                <p className="text-xs text-gray-500">{tx.date}</p>
                            </div>
                            <p className={`font-bold ${tx.positive ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.positive ? '+' : ''}₩{formatPrice(tx.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
