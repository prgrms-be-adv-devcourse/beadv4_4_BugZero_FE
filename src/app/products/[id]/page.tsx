'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { parseDate, formatKSTDate } from '@/lib/utils';


interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    condition: string;
    images: string[];
    pieces: number;
    year: number;
    inspection: {
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        result?: {
            seal: 'PASS' | 'FAIL';
            box: 'PASS' | 'FAIL';
            parts: 'PASS' | 'FAIL';
            manual: 'PASS' | 'FAIL';
            minifig: 'PASS' | 'FAIL';
            auth: 'PASS' | 'FAIL';
        };
        note?: string;
        inspectedAt?: string;
    };
    seller: {
        nickname: string;
        rating: number;
        salesCount: number;
    };
}

const mockProduct: Product = {
    id: 1,
    name: '레고 스타워즈 밀레니엄 팔콘 75192',
    description: `2023년 구매한 미개봉 신품입니다.
  
직사광선이 닿지 않는 서늘한 곳에서 보관했으며, 박스 상태 양호합니다.
정품 인증 스티커 부착되어 있습니다.

※ 직거래 불가, 택배 거래만 가능합니다.`,
    category: '스타워즈',
    condition: '미개봉',
    images: [
        'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800',
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
        'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=800',
    ],
    pieces: 7541,
    year: 2017,
    inspection: {
        status: 'APPROVED',
        result: {
            seal: 'PASS',
            box: 'PASS',
            parts: 'PASS',
            manual: 'PASS',
            minifig: 'PASS',
            auth: 'PASS',
        },
        note: '미개봉 정품 확인. 박스 상태 양호.',
        inspectedAt: '2026-01-19T14:30:00',
    },
    seller: {
        nickname: '레고덕후',
        rating: 4.8,
        salesCount: 23,
    },
};

export default function ProductDetailPage() {
    useParams(); // Kept for potential future use
    const [currentImage, setCurrentImage] = useState(0);

    const [showInspection, setShowInspection] = useState(false);
    const product = mockProduct;

    const inspectionLabels: Record<string, string> = {
        seal: '밀봉 상태',
        box: '박스 상태',
        parts: '부품 확인',
        manual: '설명서',
        minifig: '미니피규어',
        auth: '정품 확인',
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-yellow-400 transition mb-6">
                ← 목록으로
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 이미지 갤러리 */}
                <div>
                    <div className="lego-card overflow-hidden mb-4">
                        <div className="h-96 bg-gray-700">
                            <Image
                                src={product.images[currentImage]}
                                alt={product.name}
                                width={800}
                                height={384}
                                className="w-full h-full object-cover"
                            />
                        </div>

                    </div>

                    <div className="flex gap-2">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImage(idx)}
                                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${currentImage === idx ? 'border-yellow-500' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <Image src={img} alt="" width={80} height={80} className="w-full h-full object-cover" />
                            </button>

                        ))}
                    </div>
                </div>

                {/* 상품 정보 */}
                <div className="space-y-6">
                    {/* 기본 정보 */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                                {product.category}
                            </span>
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                                {product.condition}
                            </span>
                            {product.inspection.status === 'APPROVED' && (
                                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                    ✓ 검수 완료
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-4">{product.name}</h1>

                        <div className="flex gap-4 text-sm text-muted mb-6">
                            <span>🧩 {product.pieces.toLocaleString()} 피스</span>
                            <span>📅 {product.year}년 출시</span>
                        </div>
                    </div>

                    {/* 검수 정보 */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            onClick={() => setShowInspection(!showInspection)}
                            className="w-full p-4 flex justify-between items-center hover:bg-gray-700/50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔍</span>
                                <div className="text-left">
                                    <p className="font-medium text-foreground">검수 정보</p>
                                    <p className="text-sm text-muted">
                                        {formatKSTDate(product.inspection.inspectedAt!, "YYYY. MM. DD. HH:mm:ss").split(" ")[0]} 검수 완료
                                    </p>
                                </div>
                            </div>
                            <span className={`transition-transform ${showInspection ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {showInspection && product.inspection.result && (
                            <div className="p-4 pt-0 border-t border-border">
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {Object.entries(product.inspection.result).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className={`p-3 rounded-lg ${value === 'PASS' ? 'bg-green-500/10' : 'bg-red-500/10'
                                                }`}
                                        >
                                            <span className={value === 'PASS' ? 'text-green-400' : 'text-red-400'}>
                                                {value === 'PASS' ? '✓' : '✗'} {inspectionLabels[key]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {product.inspection.note && (
                                    <div className="bg-card rounded-lg p-3">
                                        <p className="text-sm text-muted">검수 메모</p>
                                        <p className="text-foreground text-sm mt-1">{product.inspection.note}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 상품 설명 */}
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h2 className="font-bold text-yellow-400 mb-4">상품 설명</h2>
                        <p className="text-gray-300 whitespace-pre-line">{product.description}</p>
                    </div>

                    {/* 판매자 정보 */}
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h2 className="font-bold text-yellow-400 mb-4">판매자</h2>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-xl">
                                    🧱
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{product.seller.nickname}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-yellow-400">★ {product.seller.rating}</span>
                                        <span className="text-muted">거래 {product.seller.salesCount}회</span>
                                    </div>
                                </div>
                            </div>
                            <button className="bg-gray-700 text-foreground py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition">
                                프로필 보기
                            </button>
                        </div>
                    </div>

                    {/* 관심 등록 버튼 */}
                    <button className="w-full py-4 bg-gray-700 rounded-xl font-medium text-foreground hover:bg-gray-600 transition flex items-center justify-center gap-2">
                        💛 관심 등록
                    </button>
                </div>
            </div>
        </div>
    );
}
