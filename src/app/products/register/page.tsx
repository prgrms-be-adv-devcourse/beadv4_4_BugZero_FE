'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api, isVerified } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';
import { components } from '@/api/schema';

type MemberInfo = components["schemas"]["MemberMeResponseDto"];

interface ProductForm {
    name: string;
    description: string;
    category: string;
    startPrice: string;
    auctionDuration: string;
}

export default function ProductRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [images, setImages] = useState<string[]>([]);
    const [form, setForm] = useState<ProductForm>({
        name: '',
        description: '',
        category: '',
        startPrice: '',
        auctionDuration: '3',
    });
    const [loading, setLoading] = useState(false);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    useEffect(() => {
        async function loadMember() {
            try {
                const info = await api.getMe();
                if (info) {
                    setMemberInfo(info);
                }
            } catch {
                console.error('Failed to load member info');

                alert('로그인이 필요하거나 서버 연결이 원활하지 않습니다.');
                router.push('/login');
            }
        }
        loadMember();
    }, [router]);

    const categories = [
        { value: '스타워즈', label: '스타워즈', icon: '⭐' },
        { value: '해리포터', label: '해리포터', icon: '🧙' },
        { value: '오리지널', label: '오리지널', icon: '🎨' },
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files).map(file => URL.createObjectURL(file));
            setImages(prev => [...prev, ...newImages].slice(0, 5));
        }
    };

    const handleSubmit = async () => {
        if (!memberInfo || !memberInfo.publicId) {
            alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');
            router.push('/login');
            return;
        }

        // if (!isVerified(memberInfo)) {
        //     setShowVerifyModal(true);
        //     return;
        // }

        setLoading(true);
        try {
            const productData = {
                name: form.name,
                category: form.category,
                description: form.description,
                productAuctionRequestDto: {
                    startPrice: Number(form.startPrice),
                    durationDays: Number(form.auctionDuration)
                },
                productImageRequestDto: images.map((url, i) => ({
                    imgUrl: url,
                    sortOrder: i
                }))
            };

            await api.createProduct(memberInfo.publicId, productData);
            alert('상품이 등록되었습니다! 검수 승인 후 경매가 시작됩니다.');
            router.push('/mypage');
        } catch (error) {
            console.error('Registration error:', error);
            alert('등록 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 돌아가기
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">상품 등록</h1>
            <p className="text-gray-400 mb-8">희귀 레고를 경매에 등록하세요</p>

            {/* 진행 단계 */}
            <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'
                            }`}>
                            {s}
                        </div>
                        <span className={step >= s ? 'text-white' : 'text-gray-500'}>
                            {s === 1 ? '기본 정보' : s === 2 ? '이미지' : '경매 설정'}
                        </span>
                        {s < 3 && <div className="w-16 h-px bg-gray-700"></div>}
                    </div>
                ))}
            </div>

            {/* Step 1: 기본 정보 */}
            {step === 1 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">상품명 *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="예: 레고 스타워즈 밀레니엄 팔콘 75192"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">카테고리 *</label>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setForm({ ...form, category: cat.value })}
                                    className={`p-3 rounded-lg text-center transition ${form.category === cat.value
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-gray-900 text-white hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="text-2xl block mb-1">{cat.icon}</span>
                                    <span className="text-xs">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">상품 설명 *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="상품의 상세 정보, 구매 시기, 보관 상태 등을 작성해주세요"
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none"
                        />
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!form.name || !form.category || !form.description}
                        className="w-full lego-btn py-4 text-black font-bold disabled:opacity-50"
                    >
                        다음 단계 →
                    </button>
                </div>
            )}

            {/* Step 2: 이미지 */}
            {step === 2 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            상품 이미지 (최대 5장) *
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                                    <Image src={img} alt="" width={100} height={100} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {images.length < 5 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition">
                                    <span className="text-3xl mb-1">📷</span>
                                    <span className="text-xs text-gray-500">추가</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            첫 번째 이미지가 대표 이미지로 사용됩니다
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 bg-gray-700 rounded-lg font-medium hover:bg-gray-600 transition"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={images.length === 0}
                            className="flex-1 lego-btn py-4 text-black font-bold disabled:opacity-50"
                        >
                            다음 단계 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: 경매 설정 */}
            {step === 3 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">시작가 *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                            <input
                                type="number"
                                value={form.startPrice}
                                onChange={(e) => setForm({ ...form, startPrice: e.target.value })}
                                placeholder="0"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-4 text-white text-xl focus:outline-none focus:border-yellow-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">경매 기간</label>
                        <div className="grid grid-cols-4 gap-3">
                            {['1', '3', '5', '7'].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setForm({ ...form, auctionDuration: days })}
                                    className={`py-4 rounded-lg font-medium transition ${form.auctionDuration === days
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-gray-900 text-white hover:bg-gray-700'
                                        }`}
                                >
                                    {days}일
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 최종 확인 */}
                    <div className="bg-gray-900 rounded-xl p-4 space-y-2">
                        <p className="text-gray-400 text-sm">등록 요약</p>
                        <p className="text-white font-medium">{form.name}</p>
                        <p className="text-yellow-400 text-xl font-bold">
                            시작가: ₩{Number(form.startPrice).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-sm">
                            경매 기간: {form.auctionDuration}일
                        </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ 상품 등록 후 검수팀의 승인이 필요합니다. 승인 완료 시 경매가 자동으로 시작됩니다.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-4 bg-gray-700 rounded-lg font-medium hover:bg-gray-600 transition"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.startPrice}
                            className="flex-1 lego-btn py-4 text-black font-bold disabled:opacity-50"
                        >
                            {loading ? '등록 중...' : '🧱 상품 등록하기'}
                        </button>
                    </div>
                </div>
            )}
            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={async () => {
                    const info = await api.getMe();
                    if (info) {
                        setMemberInfo(info);
                        setShowVerifyModal(false);
                        alert('인증이 완료되었습니다. 다시 등록 버튼을 눌러주세요.');
                    }
                }}
            />
        </div>
    );
}
