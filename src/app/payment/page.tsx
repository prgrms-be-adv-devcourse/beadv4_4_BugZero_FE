'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, MemberInfo, isVerified } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

export default function PaymentPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        async function loadData() {
            try {
                const info = await api.getMe();
                setMemberInfo(info);
                // 지갑 조회 API가 따로 없으면 getMe의 balance를 써야 하는데 MemberInfo에 balance가 없음.
                // Wallet API를 쓰거나 임시로 mock 유지
                setBalance(500000);
            } catch (error) {
                console.error('Failed to load data');
            }
        }
        loadData();
    }, []);

    const presets = [10000, 50000, 100000, 500000];

    const handleCharge = async () => {
        if (!amount || !memberInfo) return;

        if (!isVerified(memberInfo)) {
            setShowVerifyModal(true);
            return;
        }

        setLoading(true);
        try {
            // 실제 구현: Toss Payments 연동 후 redirect 되어 confirm 호출됨.
            // 여기서는 시뮬레이션을 위해 바로 confirm 호출 (테스트용)
            const orderId = `order_${Date.now()}`;
            const paymentKey = `key_${Date.now()}`;

            await api.confirmPayment(memberInfo.publicId, paymentKey, orderId, Number(amount));

            alert(`₩${formatPrice(Number(amount))} 충전 완료!`);
            setBalance(prev => prev + Number(amount));
            setAmount('');
        } catch (error) {
            console.error('Payment error:', error);
            alert('충전 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
                ← 돌아가기
            </Link>

            {/* Balance */}
            <div className="card p-6 mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">내 지갑</p>
                <p className="text-3xl font-bold text-[var(--lego-yellow)]">₩{formatPrice(balance)}</p>
            </div>

            {/* Charge */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">충전하기</h2>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {presets.map(p => (
                        <button
                            key={p}
                            onClick={() => setAmount(String(p))}
                            className={`py-2 rounded-lg text-sm font-medium transition ${amount === String(p) ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            {formatPrice(p)}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="금액 입력"
                    className="input mb-4"
                />

                <button
                    onClick={handleCharge}
                    disabled={loading || !amount}
                    className="w-full btn-primary py-3 disabled:opacity-50"
                >
                    {loading ? '처리 중...' : `₩${amount ? formatPrice(Number(amount)) : 0} 충전`}
                </button>
            </div>

            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={async () => {
                    const info = await api.getMe();
                    setMemberInfo(info);
                    setShowVerifyModal(false);
                    alert('인증이 완료되었습니다. 작업을 계속해주세요.');
                }}
            />
        </div>
    );
}
