'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProfileForm {
    nickname: string;
    email: string;
    phone: string;
    address: string;
    addressDetail: string;
}

export default function ProfileSettingsPage() {
    const [form, setForm] = useState<ProfileForm>({
        nickname: '레고덕후',
        email: 'lego_lover@email.com',
        phone: '010-1234-5678',
        address: '서울특별시 강남구 테헤란로 123',
        addressDetail: '456호',
    });
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'notification'>('profile');

    const handleSave = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('저장되었습니다!');
        } catch (error) {
            alert('저장 실패');
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
                        { key: 'password', label: '비밀번호', icon: '🔒' },
                        { key: 'notification', label: '알림 설정', icon: '🔔' },
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
                        <button className="w-full py-3 px-4 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition">
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

                            {/* 프로필 이미지 */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-4xl">
                                    🧱
                                </div>
                                <div>
                                    <button className="bg-gray-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition">
                                        이미지 변경
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (최대 2MB)</p>
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
                                    <label className="block text-sm text-gray-400 mb-2">이메일</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">소셜 로그인 연동 이메일은 변경할 수 없습니다</p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">연락처</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="010-0000-0000"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">배송지 주소</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            placeholder="주소"
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                        />
                                        <button className="bg-gray-700 text-white px-4 rounded-lg hover:bg-gray-600 transition whitespace-nowrap">
                                            주소 검색
                                        </button>
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

                    {/* 비밀번호 변경 */}
                    {activeSection === 'password' && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-yellow-400 mb-6">비밀번호 변경</h2>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                                <p className="text-blue-400 text-sm">
                                    ℹ️ 소셜 로그인을 사용 중입니다. 비밀번호는 연동된 소셜 계정에서 관리됩니다.
                                </p>
                            </div>

                            <div className="space-y-4 opacity-50">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">현재 비밀번호</label>
                                    <input
                                        type="password"
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">새 비밀번호</label>
                                    <input
                                        type="password"
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        disabled
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 알림 설정 */}
                    {activeSection === 'notification' && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-yellow-400 mb-6">알림 설정</h2>

                            <div className="space-y-4">
                                {[
                                    { key: 'bid', label: '입찰 알림', desc: '내 경매에 새로운 입찰이 있을 때' },
                                    { key: 'end', label: '경매 종료 알림', desc: '관심 경매가 곧 종료될 때' },
                                    { key: 'result', label: '낙찰/패찰 알림', desc: '경매 결과가 확정되었을 때' },
                                    { key: 'payment', label: '결제 알림', desc: '결제 기한이 다가올 때' },
                                    { key: 'shipping', label: '배송 알림', desc: '배송 상태가 변경되었을 때' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium text-white">{item.label}</p>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full lego-btn py-4 text-black font-bold mt-6">
                                저장
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
