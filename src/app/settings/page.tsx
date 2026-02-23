'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/api/utils';
import type { components } from '@/api/schema';
import { toast } from 'react-hot-toast';

type MemberInfo = components['schemas']['MemberMeResponseDto'];

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [form, setForm] = useState({
        nickname: '',
        intro: '',
        zipCode: '',
        address: '',
        addressDetail: '',
    });
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'profile' | 'withdraw'>('profile');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawConfirm, setWithdrawConfirm] = useState('');

    // 탈퇴 관련 상태
    const [withdrawalInfo, setWithdrawalInfo] = useState({
        balance: 0,
        ongoingBids: 0,
        ongoingSales: 0,
        isLoading: false,
    });

    // 회원 정보 로드
    useEffect(() => {
        const loadMemberInfo = async () => {
            try {
                const memberData = await api.getMe();
                setMemberInfo(memberData);
                setForm({
                    nickname: memberData.nickname || '',
                    intro: memberData.intro || '',
                    zipCode: memberData.zipCode || '',
                    address: memberData.address || '',
                    addressDetail: memberData.addressDetail || '',
                });
            } catch (error) {
                toast.error(error instanceof Error ? error.message : '회원 정보를 불러올 수 없습니다.');
            }
        };

        loadMemberInfo();
    }, []);

    // 탈퇴 정보 로드 (memberInfo 로드 후 role 확인)
    useEffect(() => {
        if (!memberInfo) return;

        const loadWithdrawalInfo = async () => {
            setWithdrawalInfo(prev => ({ ...prev, isLoading: true }));
            try {
                const isSeller = memberInfo.role === 'SELLER';

                const [walletRes, bidsRes, salesRes] = await Promise.all([
                    api.getMyWallet(),
                    api.getMyBids(undefined, { page: 0, size: 100 }),
                    isSeller ? api.getMySales("ALL", { page: 0, size: 100 }) : Promise.resolve({ data: [] }),
                ]);

                let ongoingBidsCount = 0;
                if (bidsRes.data) {
                    ongoingBidsCount = bidsRes.data.filter((bid) =>
                        bid.auctionStatus === 'SCHEDULED' || bid.auctionStatus === 'IN_PROGRESS'
                    ).length;
                }

                let ongoingSalesCount = 0;
                if (salesRes.data) {
                    ongoingSalesCount = salesRes.data.filter((sale) =>
                        sale.auctionStatus === 'SCHEDULED' || sale.auctionStatus === 'IN_PROGRESS'
                    ).length;
                }

                setWithdrawalInfo({
                    balance: walletRes.balance || 0,
                    ongoingBids: ongoingBidsCount,
                    ongoingSales: ongoingSalesCount,
                    isLoading: false,
                });
            } catch (error) {
                console.error('Failed to load withdrawal information:', error);
                setWithdrawalInfo(prev => ({ ...prev, isLoading: false }));
            }
        };

        loadWithdrawalInfo();
    }, [memberInfo]);

    const handleSave = async () => {
        if (!form.nickname.trim()) {
            toast.error('닉네임을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const updatedMember = await api.updateMe({
                nickname: form.nickname,
                intro: form.intro,
                zipCode: form.zipCode,
                address: form.address,
                addressDetail: form.addressDetail,
            });

            toast.success('저장되었습니다!');
            // 상태 업데이트하여 UI에 즉시 반영
            setMemberInfo(prev => prev ? {
                ...prev,
                nickname: updatedMember.nickname,
                intro: updatedMember.intro,
                zipCode: updatedMember.zipCode,
                address: updatedMember.address,
                addressDetail: updatedMember.addressDetail,
            } : null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : '저장하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/mypage" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 마이페이지
            </Link>

            <h1 className="text-3xl font-bold text-white mb-8">설정</h1>

            <div className="flex gap-8">
                {/* 사이드바 */}
                <div className="w-48 space-y-2">
                    {[
                        { key: 'profile', label: '프로필', icon: '👤' },
                        { key: 'withdraw', label: '회원탈퇴', icon: '⚠️' },
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setActiveSection(item.key as typeof activeSection)}
                            className={`w-full py-3 px-4 rounded-lg text-left transition flex items-center gap-2 ${activeSection === item.key
                                ? 'bg-yellow-500 text-black font-medium'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <button
                            onClick={() => {
                                localStorage.removeItem('accessToken');
                                window.location.href = '/login';
                            }}
                            className="w-full py-3 px-4 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition"
                        >
                            🚪 로그아웃
                        </button>
                    </div>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1">
                    {/* 프로필 설정 */}
                    {activeSection === 'profile' && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-yellow-400 mb-6">프로필 정보</h2>

                            {/* 프로필 아이콘 */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-4xl">
                                    🧱
                                </div>
                                <div>
                                    <p className="text-white font-medium">{memberInfo?.nickname || '로딩중...'}</p>
                                    <p className="text-gray-500 text-sm">{memberInfo?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">닉네임</label>
                                    <input
                                        type="text"
                                        value={form.nickname}
                                        onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">자기소개</label>
                                    <textarea
                                        value={form.intro}
                                        onChange={(e) => setForm({ ...form, intro: e.target.value })}
                                        placeholder="자기소개를 입력해주세요"
                                        rows={3}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">이메일</label>
                                    <input
                                        type="email"
                                        value={memberInfo?.email || ''}
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">소셜 로그인 연동 이메일은 변경할 수 없습니다</p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">연락처 (인증됨)</label>
                                    <input
                                        type="tel"
                                        value={memberInfo?.contactPhoneMasked || '본인인증 전입니다'}
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">주소</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={form.zipCode}
                                            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                                            placeholder="우편번호"
                                            className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                        />
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            placeholder="주소"
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={form.addressDetail}
                                        onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                                        placeholder="상세주소"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full lego-btn py-4 text-black font-bold mt-6 disabled:opacity-50"
                            >
                                {loading ? '저장 중...' : '변경사항 저장'}
                            </button>
                        </div>
                    )}



                    {/* 회원탈퇴 */}
                    {activeSection === 'withdraw' && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-red-400 mb-6">회원탈퇴</h2>

                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                                <p className="text-red-400 text-sm font-medium mb-2">⚠️ 탈퇴 전 주의사항</p>
                                <ul className="text-red-300 text-sm space-y-1">
                                    <li>• 진행 중인 경매가 있으면 탈퇴할 수 없습니다.</li>
                                    <li>• 지갑 잔액은 환불 요청 후 탈퇴해주세요.</li>
                                    <li>• 탈퇴 후 모든 데이터는 복구할 수 없습니다.</li>
                                </ul>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-4 mb-6">
                                {withdrawalInfo.isLoading ? (
                                    <div className="text-center text-gray-400 py-4">조회 중...</div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">현재 지갑 잔액</span>
                                            <span className="text-yellow-400 font-medium">₩{withdrawalInfo.balance.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">진행중 입찰</span>
                                            <span className={`${withdrawalInfo.ongoingBids > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>{withdrawalInfo.ongoingBids}건</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">진행중 판매</span>
                                            <span className={`${withdrawalInfo.ongoingSales > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>{withdrawalInfo.ongoingSales}건</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={withdrawalInfo.balance > 0 || withdrawalInfo.ongoingBids > 0 || withdrawalInfo.ongoingSales > 0 || withdrawalInfo.isLoading}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                            >
                                {withdrawalInfo.balance > 0 || withdrawalInfo.ongoingBids > 0 || withdrawalInfo.ongoingSales > 0 ? '탈퇴 불가 (잔액/진행건수 확인 필요)' : '회원탈퇴'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 회원탈퇴 확인 모달 */}
            {
                showWithdrawModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">⚠️</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">정말 탈퇴하시겠습니까?</h3>
                                <p className="text-gray-400 text-sm">
                                    탈퇴 확인을 위해 아래에 &quot;탈퇴합니다&quot;를 입력해주세요.
                                </p>
                            </div>

                            <input
                                type="text"
                                value={withdrawConfirm}
                                onChange={(e) => setWithdrawConfirm(e.target.value)}
                                placeholder="탈퇴합니다"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-center mb-4 focus:outline-none focus:border-red-500"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowWithdrawModal(false); setWithdrawConfirm(''); }}
                                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={async () => {
                                        if (withdrawConfirm === '탈퇴합니다') {
                                            try {
                                                await api.withdrawMember();
                                                useAuthStore.getState().clearAuth();
                                                toast.success('회원탈퇴가 완료되었습니다.');
                                                router.push('/login');
                                            } catch (error) {
                                                toast.error(error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.');
                                            }
                                        } else {
                                            toast.error('"탈퇴합니다"를 정확히 입력해주세요.');
                                        }
                                    }}
                                    disabled={withdrawConfirm !== '탈퇴합니다'}
                                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition"
                                >
                                    탈퇴하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
