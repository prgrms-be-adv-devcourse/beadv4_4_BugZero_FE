'use client';

import { useEffect, useState } from 'react';
import { api, getImageUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import InspectionModal from '@/components/InspectionModal';

export default function AdminInspectionPage() {
    const { role, isLoggedIn } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    useEffect(() => {
        // 관리자 권한 체크
        if (!isLoggedIn || role !== 'ADMIN') {
            alert('관리자 권한이 필요합니다.');
            router.push('/');
            return;
        }
        fetchPendingProducts();
    }, [isLoggedIn, role, router]);

    const fetchPendingProducts = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminProducts({ status: 'PENDING' });
            setProducts(data.data || []);
        } catch (error) {
            console.error('Failed to fetch admin products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-20 text-center">
                <div className="inline-block animate-spin text-4xl mb-4">🧱</div>
                <p className="text-gray-400">검수 대기 상품을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">검수 관리</h1>
                    <p className="text-gray-500">대기 중인 상품의 등급을 판정하고 경매를 승인합니다.</p>
                </div>
                <div className="bg-[#111111] border border-[#222222] px-4 py-2 rounded-full">
                    <span className="text-sm font-bold text-gray-400">대기 상품: </span>
                    <span className="text-sm font-black text-yellow-400">{products.length}건</span>
                </div>
            </header>

            {products.length === 0 ? (
                <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-3xl py-32 text-center">
                    <span className="text-6xl mb-6 block opacity-20">📦</span>
                    <h3 className="text-xl font-bold text-gray-500">검수 대기 상품이 없습니다.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.ProductId}
                            className="bg-[#111111] border border-[#222222] rounded-3xl p-6 hover:border-yellow-400/50 transition-all group overflow-hidden relative"
                        >
                            {product.thumbnail && (
                                <div className="absolute top-0 right-0 w-24 h-24 opacity-10 -mr-4 -mt-4 pointer-events-none">
                                    <img src={getImageUrl(product.thumbnail)} alt="" className="w-full h-full object-cover rounded-full" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-[#1a1a1a] px-3 py-1 rounded-full text-[10px] font-bold text-yellow-400 tracking-wider">
                                    {product.inspectionStatus}
                                </div>
                                <span className="text-xs text-gray-600 font-mono">ID: {product.ProductId}</span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition truncate pr-8">
                                {product.name}
                            </h3>

                            <div className="space-y-2 mb-8 border-l-2 border-[#222222] pl-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 text-xs">카테고리</span>
                                    <span className="text-gray-300 font-medium">{product.category}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 text-xs">판매자</span>
                                    <span className="text-white font-medium text-xs truncate max-w-[150px]">{product.sellerEmail}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedProduct(product)}
                                className="w-full bg-[#1a1a1a] hover:bg-yellow-400 hover:text-black text-white font-bold py-4 rounded-2xl transition-all duration-300"
                            >
                                검수하기
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedProduct && (
                <InspectionModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onSuccess={fetchPendingProducts}
                />
            )}
        </div>
    );
}
