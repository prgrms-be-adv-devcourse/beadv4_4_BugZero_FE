'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMemberStore } from '@/store/useMemberStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { components } from "@/api/schema";
import { getErrorMessage } from '@/api/utils';
import toast from 'react-hot-toast';


interface ProductForm {
    name: string;
    description: string;
    category: "STARWARS" | "ORIGINAL" | "HARRYPOTTER" | "TECHNIC" | "ICONS" | "IDEAS" | "ARCHITECTURE" | "NINJAGO" | "CITY" | "ETC" | "";
    startPrice: string;
    auctionDuration: string;
}

export default function ProductRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { memberInfo, isSeller, isLoaded, fetchMemberInfo } = useMemberStore();

    useEffect(() => {
        const checkAuth = async () => {
            const info = await fetchMemberInfo();
            if (!info) {
                router.push('/login');
                return;
            }
            if (!isSeller) {
                router.replace('/seller/onboarding');
            }
        };
        checkAuth();
    }, [fetchMemberInfo, isSeller, router]);

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

    // --- [AI 가격 추천 관련 상태] ---
    const [internalPrices, setInternalPrices] = useState<components["schemas"]["AiInternalPriceResponseDto"][] | null>(null);
    const [externalPriceText, setExternalPriceText] = useState<string>("");
    const [isRecommending, setIsRecommending] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);

    if (!isLoaded || !memberInfo || !isSeller) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }


    // loadMember가 다른 곳(재검증 등)에서도 쓰이므로 밖으로 빼는 게 좋다면, useCallback을 써야 함.
    // 하지만 현재 코드 구조상 useEffect 안에서만 초기 호출되고,
    // 나중에 verifyModal 등에서 다시 호출됨.
    // 따라서 중복을 피하기 위해 함수 정의는 밖으로 두고, useCallback 처리 하거나
    // 그냥 eslint-disable을 하는게 가장 간단하지만, 정석은 useCallback임.

    // 재사용을 위해 원래 함수 유지 + lint fix:
    // 그러나 useEffect가 loadMember를 의존성으로 가지려면 loadMember가 useCallback이어야 함.

    const categories: { value: ProductForm['category']; label: string; icon: string }[] = [
        { value: 'STARWARS', label: '스타워즈', icon: '⭐' },
        { value: 'HARRYPOTTER', label: '해리포터', icon: '🧙' },
        { value: 'ORIGINAL', label: '오리지널', icon: '🎨' },
        { value: 'TECHNIC', label: '테크닉', icon: '🔧' },
        { value: 'ICONS', label: '아이콘', icon: '🏰' },
        { value: 'IDEAS', label: '아이디어', icon: '💡' },
        { value: 'ARCHITECTURE', label: '아키텍처', icon: '🏛️' },
        { value: 'NINJAGO', label: '닌자고', icon: '🥷' },
        { value: 'CITY', label: '시티', icon: '🏙️' },
        { value: 'ETC', label: '기타', icon: '📦' },
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
            toast.error('로그인 정보가 없습니다.');
            return;
        }

        setLoading(true);
        try {
            // 판매자 체크는 페이지 진입 시 이미 완료됨 (리다이렉트)

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
            const productData: components["schemas"]["ProductCreateRequestDto"] = {
                name: form.name,
                category: form.category as "STARWARS" | "ORIGINAL" | "HARRYPOTTER" | "TECHNIC" | "ICONS" | "IDEAS" | "ARCHITECTURE" | "NINJAGO" | "CITY" | "ETC",
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

            await api.createProduct(productData);
            toast.success('상품이 등록되었습니다! 검수 승인 후 경매가 시작됩니다.');
            router.push('/mypage');

        } catch (error) {
            const message = getErrorMessage(error, "상품 등록 중 오류가 발생했습니다.");
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGetRecommendations = async () => {
        if (!form.name || !form.category) {
            toast.error("상품명과 카테고리를 먼저 입력해주세요.");
            return;
        }

        setIsRecommending(true);
        setShowRecommendations(true);
        setInternalPrices(null);
        setExternalPriceText(""); // 초기화

        // 1. 내부 시세 (단건 호출)
        try {
            const internalData = await api.getInternalPriceGuide({
                category: form.category as "STARWARS" | "ORIGINAL" | "HARRYPOTTER" | "TECHNIC" | "ICONS" | "IDEAS" | "ARCHITECTURE" | "NINJAGO" | "CITY" | "ETC",
                condition: "MISB", // 기본값 설정 (추후 입력받을 수도 있음)
                name: form.name,
                description: form.description
            });
            setInternalPrices(internalData);
        } catch (e) {
            console.error(e);
            toast.error("내부 시세 추천 실패");
        }

        // 2. 외부 시세 (SSE 스트리밍)
        try {
            const token = useAuthStore.getState().accessToken;

            const response = await fetch(api.getExternalPriceGuideUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    category: form.category,
                    condition: "MISB",
                    name: form.name
                })
            });

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                // SSE 형식 파싱 (data: ... )
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data:")) {
                        // "data:" 접두어 제거 및 앞뒤 공백 제거하지 않음 (공백도 중요할 수 있음)
                        // 보통 SSE는 "data: hello" 형태.
                        // 토큰 단위로 온다면 "data: 안", "data: 녕"...
                        const data = line.replace("data:", "");
                        // 엔터 처리를 위해 특수 시그널이 있는지 확인하거나, 그냥 쭉 이어붙임.
                        // 만약 실제 줄바꿈이 필요하면 \n을 data에 포함해서 주는지 확인 필요.
                        // 일반적으로 LLM 스트리밍응답은 줄바꿈 문자를 포함함.
                        if (data) {
                            setExternalPriceText(prev => prev + data);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            // 스트리밍 중 에러가 발생해도, 이미 받은 데이터가 있으면 실패로 간주하지 않음
            // (ERR_INCOMPLETE_CHUNKED_ENCODING 등으로 인해 끊겨도 내용은 다 들어왔을 수 있음)
            if (!externalPriceText) {
                toast.error("외부 시세 추천을 불러오지 못했습니다.");
            }
        } finally {
            setIsRecommending(false);
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
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm text-gray-400">경매 시작가 *</label>
                            <button
                                onClick={handleGetRecommendations}
                                disabled={isRecommending}
                                className="text-xs bg-indigo-600 px-3 py-1 rounded text-white hover:bg-indigo-700 transition flex items-center gap-1"
                            >
                                {isRecommending ? (
                                    <>
                                        <span className="animate-spin">⏳</span> 분석 중...
                                    </>
                                ) : (
                                    <>🤖 AI 가격 추천</>
                                )}
                            </button>
                        </div>

                        {/* AI 가격 추천 결과 영역 */}
                        {showRecommendations && (
                            <div className="mb-4 bg-gray-900 p-4 rounded-lg border border-indigo-900/50">
                                <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                                    <span>💡 AI 추천 리포트</span>
                                </h3>

                                <div className="space-y-4">
                                    {/* 내부 시세 데이터 */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">BeAdv 내부 거래 데이터 분석</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {internalPrices ? (
                                                internalPrices.length > 0 ? (
                                                    internalPrices.map((item, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setForm({ ...form, startPrice: String(item.finalPrice || item.startPrice || 0) })}
                                                            className="text-left p-2 bg-gray-800 rounded border border-gray-700 hover:border-indigo-500 transition group"
                                                        >
                                                            <div className="text-xs text-gray-400 truncate w-full">{item.productName}</div>
                                                            <div className="text-indigo-400 font-bold group-hover:text-indigo-300">
                                                                ₩ {(item.finalPrice || item.startPrice || 0).toLocaleString()}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 text-xs text-gray-600 text-center py-2">유사한 거래 내역이 없습니다.</div>
                                                )
                                            ) : (
                                                <div className="col-span-2 flex justify-center py-2">
                                                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 외부 시세 데이터 (Streaming) */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">외부 시세 (BrickLink, eBay 등)</p>
                                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar bg-gray-800/50 p-3 rounded">
                                            {externalPriceText ? (
                                                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                    {externalPriceText.split('-').map((line, index) => (
                                                        index === 0 && line.trim() === '' ? null : (
                                                            <div key={index}>
                                                                {index > 0 ? '- ' : ''}{line.trim()}
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            ) : (
                                                isRecommending && (
                                                    <div className="text-xs text-gray-600 animate-pulse">외부 데이터를 수집하고 있습니다...</div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
        </div>
    );
}