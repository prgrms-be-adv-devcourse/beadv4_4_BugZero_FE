'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type MemberInfo } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';
import toast from 'react-hot-toast';

export default function MyPage() {
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // 본인인증 여부 판단
    const isVerified = api.isVerified(memberInfo);
    const userRole = memberInfo?.role as 'USER' | 'SELLER' | 'ADMIN' || 'USER';

    // 회원 정보 로드
    useEffect(() => {
        const loadMemberInfo = async () => {
            try {
                const data = await api.getMe();
                if (data) {
                    setMemberInfo(data);
                }
            } catch (error) {
                console.error('회원 정보 로드 실패:', error);
            }
        };
        loadMemberInfo();
    }, []);



    return (
        <div className="max-w-3xl mx-auto py-8 px-4">

            {/* Profile */}
            <div className="card p-6 mb-8 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/20 overflow-hidden bg-card border border-border">
                            <img src={userRole === 'ADMIN' ? '/admin-logo.png' : '/main-logo.png'} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xl font-bold">{memberInfo?.nickname || '로딩중...'}</p>
                                {isVerified && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">인증완료</span>}
                            </div>
                            <p className="text-sm text-muted">{memberInfo?.email || ''}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-card text-xs font-medium text-muted border border-border">
                            {userRole}
                        </span>
                        {memberInfo?.createdAt && (
                            <p className="text-[10px] text-gray-600 mt-2">가입일: {new Date(memberInfo.createdAt).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>

                {memberInfo?.intro && (
                    <p className="text-sm text-muted mb-6 bg-card/50 p-3 rounded-lg">&quot;{memberInfo.intro}&quot;</p>
                )}



                <div className="mt-6 pt-4 border-t border-border">
                    <Link href="/settings" className="block w-full bg-card text-foreground py-3 text-center text-sm rounded-xl font-semibold hover:bg-muted transition border border-border hover:border-gray-500">
                        ⚙️ 설정 및 프로필 수정
                    </Link>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/mypage/bids">
                    <div className="card p-6 h-full hover:border-[var(--lego-yellow)]/50 transition hover:bg-card group bg-card/50 border border-border rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-3xl bg-card w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition">🏷️</span>
                            <span className="text-muted text-2xl group-hover:translate-x-1 transition">→</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">내 입찰 내역</h3>
                        <p className="text-sm text-muted">참여중인 경매와 입찰 기록을 확인하세요.</p>
                    </div>
                </Link>

                <Link href="/mypage/orders">
                    <div className="card p-6 h-full hover:border-[var(--lego-yellow)]/50 transition hover:bg-card group bg-card/50 border border-border rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-3xl bg-card w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition">🏆</span>
                            <span className="text-muted text-2xl group-hover:translate-x-1 transition">→</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">내 낙찰(주문) 내역</h3>
                        <p className="text-sm text-muted">낙찰된 물품을 확인하고 결제를 진행하세요.</p>
                    </div>
                </Link>

                {userRole === 'SELLER' && (
                    <Link href="/mypage/sales">
                        <div className="card p-6 h-full hover:border-[var(--lego-yellow)]/50 transition hover:bg-card group bg-card/50 border border-border rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-3xl bg-card w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition">📤</span>
                                <span className="text-muted text-2xl group-hover:translate-x-1 transition">→</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1">내 판매 내역</h3>
                            <p className="text-sm text-muted">등록한 경매의 현황과 낙찰 정보를 관리하세요.</p>
                        </div>
                    </Link>
                )}

                {userRole === 'SELLER' && (
                    <Link href="/mypage/settlements">
                        <div className="card p-6 h-full hover:border-[var(--lego-yellow)]/50 transition hover:bg-card group bg-card/50 border border-border rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-3xl bg-card w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition">📊</span>
                                <span className="text-muted text-2xl group-hover:translate-x-1 transition">→</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1">정산 내역</h3>
                            <p className="text-sm text-muted">판매 정산 내역과 수수료를 확인하세요.</p>
                        </div>
                    </Link>
                )}

                <Link href="/mypage/wallet">
                    <div className="card p-6 h-full hover:border-[var(--lego-yellow)]/50 transition hover:bg-card group bg-card/50 border border-border rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-3xl bg-card w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition">💰</span>
                            <span className="text-muted text-2xl group-hover:translate-x-1 transition">→</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">지갑 / 거래내역</h3>
                        <p className="text-sm text-muted">예치금을 충전하고 입출금 내역을 확인하세요.</p>
                    </div>
                </Link>
            </div>

            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={async () => {
                    // 회원 정보 새로고침
                    const data = await api.getMe();
                    if (data) {
                        setMemberInfo(data);
                    }
                    setShowVerifyModal(false);
                    toast.success('본인인증이 완료되었습니다.');
                }}
            />
        </div>
    );
}
