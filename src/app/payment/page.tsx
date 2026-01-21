'use client';

import { components } from "@/api/schema";
import { getErrorMessage } from "@/api/utils";
import VerifyModal from "@/components/VerifyModal";
import { api } from "@/lib/api";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

type MemberInfo = components["schemas"]["MemberMeResponseDto"];

export default function PaymentPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [balance, setBalance] = useState(0);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);

    const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

    useEffect(() => {
        async function loadData() {
            try {
                const info = await api.getMe();

                if (info) {
                    setMemberInfo(info);
                }

                // 지갑을 조회하여 잔액을 얻어으는 api 구현 필요
                setBalance(0);
            } catch (error: unknown) {
                const message = getErrorMessage(error, "사용자 정보를 불러오지 못했습니다.");
                console.error('[PaymentPage] Load Data Error:', message);
            }
        }
        loadData();
    }, []);

    const presets = [10000, 50000, 100000, 500000];

    const handleCharge = async () => {
        if (!amount || !memberInfo) return;

        // 본인 인증 체크 (추후 활성화 시 getMe 정보 기반으로 체크)
        /*
        if (!memberInfo.realNameMasked || !memberInfo.contactPhoneMasked) {
            setShowVerifyModal(true);
            return;
        }
        */

        setLoading(true);
        try {
            const chargeInfo = await api.requestPayment(Number(amount));

            if (!chargeInfo) {
                throw new Error('결제 요청에 대한 응답이 유효하지 않습니다.');
            }

            const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

            await tossPayments.requestPayment('카드', {
                amount: chargeInfo.amount ?? Number(amount),
                orderId: chargeInfo.orderId ?? `order_${Date.now()}`,
                orderName: 'RareGo 예치금 충전',
                customerName: chargeInfo.customerName,
                customerEmail: chargeInfo.customerEmail,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
            });

        } catch (error: unknown) {
            // any를 제거하고 unknown과 getErrorMessage 사용
            const message = getErrorMessage(error, "충전 진행 중 오류가 발생했습니다.");

            if (message === "취소되었습니다.") { // 결제 취소 시 토스에서 오는 에러 메세지
                console.log("[PaymentPage] 사용자가 결제를 취소했습니다.");
                return;
            }

            console.error('[PaymentPage] Charge Error:', message);
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-10">
            {/* ... 기존 UI 코드 동일 ... */}
            <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
                ← 돌아가기
            </Link>

            <div className="card p-6 mb-6 text-center border border-[#1a1a1a] bg-[#0d0d0d]">
                <p className="text-gray-400 text-sm mb-1">내 예치금 잔액</p>
                <p className="text-3xl font-bold text-yellow-400">₩{formatPrice(balance)}</p>
            </div>

            <div className="card p-6 border border-[#1a1a1a] bg-[#0d0d0d]">
                <h2 className="font-semibold mb-4 text-white">예치금 충전</h2>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {presets.map(p => (
                        <button
                            key={p}
                            onClick={() => setAmount(String(p))}
                            className={`py-2 rounded-lg text-xs font-medium transition ${amount === String(p)
                                ? 'bg-yellow-400 text-black'
                                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#262626]'
                                }`}
                        >
                            {formatPrice(p)}
                        </button>
                    ))}
                </div>

                <div className="relative mb-6">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="직접 입력"
                        className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-yellow-400 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                </div>

                <button
                    onClick={handleCharge}
                    disabled={loading || !amount}
                    className="w-full bg-yellow-400 text-black font-bold py-4 rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? '준비 중...' : `₩${amount ? formatPrice(Number(amount)) : 0} 충전하기`}
                </button>
            </div>

            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={async () => {
                    try {
                        const info = await api.getMe();

                        if (info) {
                            setMemberInfo(info);
                            setShowVerifyModal(false);
                            alert('본인 인증이 완료되었습니다.');
                        }

                    } catch (error) {
                        const message = getErrorMessage(error, "인증 정보를 갱신하지 못했습니다.");
                        alert(message);
                    }
                }}
            />
        </div>
    );
}