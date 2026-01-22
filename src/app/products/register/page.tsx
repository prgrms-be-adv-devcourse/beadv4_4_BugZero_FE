'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';
import SellerInfoModal from '@/components/SellerInfoModal';
import type { components } from "@/api/schema";
import { getErrorMessage } from '@/api/utils';

// 스키마에서 타입 추출
type MemberInfo = components["schemas"]["MemberMeResponseDto"];

interface ProductForm {
    name: string;
    description: string;
    category: "스타워즈" | "오리지널" | "해리포터" | "";
    startPrice: string;
    auctionDuration: string;
}

export default function ProductRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);

    // 모달 상태 관리
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // 이미지 관리를 위한 상태
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [form, setForm] = useState<ProductForm>({
        name: '',
        description: '',
        category: '',
        startPrice: '',
        auctionDuration: '3',
    });

    const loadMember = useCallback(async () => {
        try {
            const info = await api.getMe();
            if (info) {
                setMemberInfo(info);
                return info;
            }
        } catch {
            console.error('Failed to load member info');
            router.push('/login');
        }
        return null;
    }, [router]);

    useEffect(() => {
        loadMember();
    }, [loadMember]);

    // loadMember가 다른 곳(재검증 등)에서도 쓰이므로 밖으로 빼는 게 좋다면, useCallback을 써야 함.
    // 하지만 현재 코드 구조상 useEffect 안에서만 초기 호출되고,
    // 나중에 verifyModal 등에서 다시 호출됨.
    // 따라서 중복을 피하기 위해 함수 정의는 밖으로 두고, useCallback 처리 하거나
    // 그냥 eslint-disable을 하는게 가장 간단하지만, 정석은 useCallback임.

    // 재사용을 위해 원래 함수 유지 + lint fix:
    // 그러나 useEffect가 loadMember를 의존성으로 가지려면 loadMember가 useCallback이어야 함.

    const categories: { value: ProductForm['category']; label: string; icon: string }[] = [
        { value: '스타워즈', label: '스타워즈', icon: '⭐' },
        { value: '해리포터', label: '해리포터', icon: '🧙' },
        { value: '오리지널', label: '오리지널', icon: '🎨' },
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles].slice(0, 5));
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!memberInfo?.publicId) {
            alert('로그인 정보가 없습니다.');
            return;
        }

        setLoading(true);
        try {
            // --- [1단계: 본인 인증 체크] ---
            // Masked 데이터가 없거나 실제 값이 비어있는 경우 체크
            if (!memberInfo.realNameMasked || !memberInfo.contactPhoneMasked) {
                alert("판매자 등록을 위해 실명 인증이 필요합니다.");
                setShowVerifyModal(true);
                setLoading(false);
                return;
            }

            // --- [2단계: 추가 정보(주소) 체크] ---
            if (!memberInfo.address || !memberInfo.zipCode) {
                alert("판매 물품 수거를 위해 주소 정보 등록이 필요합니다.");
                setShowAddressModal(true);
                setLoading(false);
                return;
            }

            // --- [3단계: 판매자 자격 활성화 (SELLER 권한)] ---
            if (memberInfo.role !== 'SELLER') {
                const confirmPromote = confirm("판매자 자격이 필요합니다. 입력된 정보를 바탕으로 판매자 자격을 활성화하시겠습니까?");
                if (!confirmPromote) {
                    setLoading(false);
                    return;
                }
                await api.promoteSeller();

                await api.refreshAccessToken();

                alert("판매자 자격이 활성화되었습니다!");
                const updatedInfo = await loadMember(); // 정보 새로고침

                if (!updatedInfo) return;
            }

            // --- [4단계: S3 이미지 업로드] ---
            const uploadedS3Paths = await Promise.all(
                imageFiles.map(async (file) => {
                    const presigned = await api.getPresignedUrl({
                        fileName: file.name,
                        contentType: file.type
                    });
                    if (!presigned?.url || !presigned?.s3Path) throw new Error("업로드 권한을 얻지 못했습니다.");

                    await fetch(presigned.url, {
                        method: 'PUT',
                        body: file,
                        headers: { 'Content-Type': file.type }
                    });
                    return presigned.s3Path;
                })
            );

            // --- [5단계: 최종 상품 등록] ---
            const productData: components["schemas"]["ProductRequestDto"] = {
                name: form.name,
                category: form.category as "스타워즈" | "오리지널" | "해리포터",
                description: form.description,
                productAuctionRequestDto: {
                    startPrice: Number(form.startPrice),
                    durationDays: Number(form.auctionDuration)
                },
                productImageRequestDto: uploadedS3Paths.map((path, i) => ({
                    imgUrl: path,
                    sortOrder: i
                }))
            };

            await api.createProduct(memberInfo.publicId, productData);
            alert('상품이 등록되었습니다! 검수 승인 후 경매가 시작됩니다.');
            router.push('/mypage');

        } catch (error) {
            const message = getErrorMessage(error, "상품 등록 중 오류가 발생했습니다.");
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 돌아가기
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">상품 등록</h1>
            <p className="text-gray-400 mb-8">희귀 레고를 경매에 등록하세요</p>

            <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                            {s}
                        </div>
                        <span className={step >= s ? 'text-white' : 'text-gray-500'}>
                            {s === 1 ? '기본 정보' : s === 2 ? '이미지' : '경매 설정'}
                        </span>
                        {s < 3 && <div className="w-16 h-px bg-gray-700"></div>}
                    </div>
                ))}
            </div>

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
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setForm({ ...form, category: cat.value })}
                                    className={`p-3 rounded-lg text-center transition ${form.category === cat.value ? 'bg-yellow-500 text-black' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
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
                            placeholder="보관 상태 등을 상세히 작성해주세요"
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none"
                        />
                    </div>
                    <button
                        onClick={() => setStep(2)}
                        disabled={!form.name || !form.category || !form.description}
                        className="w-full bg-yellow-500 py-4 text-black font-bold rounded-lg disabled:opacity-50"
                    >
                        다음 단계 →
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">상품 이미지 (최대 5장) *</label>
                        <div className="grid grid-cols-5 gap-3">
                            {previews.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                                    <Image src={img} alt="미리보기" fill className="object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                                    >✕</button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition bg-gray-900">
                                    <span className="text-2xl mb-1">📷</span>
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-700 rounded-lg text-white font-medium">← 이전</button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={imageFiles.length === 0}
                            className="flex-1 bg-yellow-500 py-4 text-black font-bold rounded-lg disabled:opacity-50"
                        >다음 단계 →</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">경매 시작가 *</label>
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
                                    className={`py-4 rounded-lg font-medium transition ${form.auctionDuration === days ? 'bg-yellow-500 text-black' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                                >
                                    {days}일
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-700 rounded-lg text-white font-medium">← 이전</button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.startPrice}
                            className="flex-1 bg-yellow-500 py-4 text-black font-bold rounded-lg disabled:opacity-50"
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
                onVerified={loadMember}
            />

            {/* 주소 등록 모달 */}
            <SellerInfoModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onUpdated={loadMember}
            />
        </div>
    );
}