'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';


type InspectionResult = 'PASS' | 'FAIL' | 'PENDING';

interface InspectionItem {
    id: string;
    label: string;
    description: string;
}

const inspectionItems: InspectionItem[] = [
    { id: 'seal', label: '밀봉 상태', description: '박스 밀봉이 온전한지 확인' },
    { id: 'box', label: '박스 상태', description: '박스 손상, 찢김, 눌림 확인' },
    { id: 'parts', label: '부품 확인', description: '부품 수량 및 상태 확인' },
    { id: 'manual', label: '설명서', description: '설명서 유무 및 상태 확인' },
    { id: 'minifig', label: '미니피규어', description: '미니피규어 유무 및 상태 확인' },
    { id: 'auth', label: '정품 확인', description: '정품 여부 확인' },
];

export default function ProductInspectionPage() {
    const params = useParams();
    const productId = params.id;

    const [results, setResults] = useState<Record<string, InspectionResult>>({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock product data
    const product = {
        name: '레고 스타워즈 밀레니엄 팔콘 75192',
        seller: '레고덕후',
        category: '스타워즈',
        condition: '미개봉',
        description: '미개봉 신품입니다. 2023년 구매, 직사광선 없는 곳에서 보관했습니다.',
        images: [
            'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400',
        ],
        submittedAt: '2026-01-20T10:00:00',
    };

    const handleResult = (itemId: string, result: InspectionResult) => {
        setResults(prev => ({ ...prev, [itemId]: result }));
    };

    const handleSubmit = async (finalResult: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            // TODO: API 연동
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert(`검수 ${finalResult === 'APPROVED' ? '승인' : '거부'} 완료!`);
        } catch {
            alert('처리 실패');
        } finally {


            setLoading(false);
        }
    };

    const allChecked = inspectionItems.every(item => results[item.id]);
    const hasFailure = Object.values(results).some(r => r === 'FAIL');

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 검수 목록으로
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">상품 검수</h1>
                    <p className="text-gray-400 mt-1">상품 #{productId}</p>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full font-medium">
                    검수 대기 중
                </span>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* 왼쪽: 상품 정보 */}
                <div className="space-y-6">
                    <div className="lego-card overflow-hidden">
                        <div className="h-64 bg-gray-700">
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={400}
                                height={256}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">

                        <h2 className="font-bold text-lg text-white mb-4">{product.name}</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">판매자</span>
                                <span className="text-white">{product.seller}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">카테고리</span>
                                <span className="text-white">{product.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">신고 상태</span>
                                <span className="text-white">{product.condition}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">등록 일시</span>
                                <span className="text-white">{new Date(product.submittedAt).toLocaleDateString('ko-KR')}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-gray-500 text-sm mb-2">상품 설명</p>
                            <p className="text-white text-sm">{product.description}</p>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 검수 체크리스트 */}
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6">검수 체크리스트</h2>

                        <div className="space-y-4">
                            {inspectionItems.map((item) => (
                                <div key={item.id} className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-white">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['PASS', 'FAIL', 'PENDING'] as InspectionResult[]).map((result) => (
                                            <button
                                                key={result}
                                                onClick={() => handleResult(item.id, result)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${results[item.id] === result
                                                    ? result === 'PASS' ? 'bg-green-500 text-white'
                                                        : result === 'FAIL' ? 'bg-red-500 text-white'
                                                            : 'bg-yellow-500 text-black'
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {result === 'PASS' ? '✓ 통과' : result === 'FAIL' ? '✕ 불합격' : '? 보류'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 검수 메모 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <label className="block text-sm text-gray-400 mb-2">검수 메모</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="검수 시 특이사항이나 메모를 작성하세요"
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none"
                        />
                    </div>

                    {/* 최종 결정 */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSubmit('REJECTED')}
                            disabled={loading || !allChecked}
                            className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
                        >
                            ❌ 검수 거부
                        </button>
                        <button
                            onClick={() => handleSubmit('APPROVED')}
                            disabled={loading || !allChecked || hasFailure}
                            className="flex-1 lego-btn py-4 text-black font-bold disabled:opacity-50"
                        >
                            ✅ 검수 승인
                        </button>
                    </div>

                    {!allChecked && (
                        <p className="text-center text-yellow-400 text-sm">
                            모든 항목을 체크해주세요
                        </p>
                    )}
                    {hasFailure && allChecked && (
                        <p className="text-center text-red-400 text-sm">
                            불합격 항목이 있어 승인할 수 없습니다
                        </p>
                    )}
                </div>
            </div>
        </div >
    );
}
