'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

import toast from 'react-hot-toast'; // ✅ 추가

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const isLogin = !!accessToken;

    // 1. 로그인 여부와 상관없이 항상 노출되는 메뉴
    const publicNavItems = [
        { href: '/', label: '경매' },
        { href: '/products/register', label: '판매' },
    ];

    // 2. 로그인 시에만 추가로 노출되는 메뉴 (관심, 마이페이지)
    const privateNavItems = [
        { href: '/wishlist', label: '관심' },
        { href: '/mypage', label: '마이페이지' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // 판매하기 등 공용 메뉴 중 권한이 필요한 경우의 클릭 핸들러
    const handleProtectedClick = (e: React.MouseEvent, href: string) => {
        if (!isLogin && href === '/products/register') {
            e.preventDefault();
            toast.error('판매 등록은 로그인 후 이용 가능합니다.');
            router.push('/login');
        }
    };

    const handleLogout = async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        try {
            await api.logout();
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            useAuthStore.getState().clearAuth();
            toast.success('로그아웃 되었습니다.');
            router.push('/');
        }
    };

    return (
        <header className="border-b border-[#1a1a1a] sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
            <nav className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">

                    {/* 로고 섹션 */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="text-2xl transition-transform group-hover:scale-110">🧱</span>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-white">RareGo</span>
                            <span className="text-[10px] text-gray-500 -mt-1 tracking-widest uppercase">
                                Rare Lego Auction
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-6 mr-4 border-r border-[#1a1a1a] pr-6">
                            {/* 공용 메뉴: 경매, 판매 */}
                            {publicNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={(e) => handleProtectedClick(e, item.href)}
                                    className={`text-sm transition font-medium ${isActive(item.href)
                                        ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* 로그인 전용 메뉴: 관심, 마이페이지 */}
                            {isLogin && privateNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`text-sm transition font-medium ${isActive(item.href)
                                        ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* 인증 버튼 섹션 */}
                        <div className="flex items-center gap-4">
                            {isLogin ? (
                                <>
                                    <Link
                                        href="/payment"
                                        className="lego-btn text-sm py-2 px-4 text-black font-bold bg-yellow-400 rounded hover:brightness-110 transition"
                                    >
                                        충전
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-gray-500 hover:text-red-400 transition font-medium"
                                    >
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-sm text-white bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-lg transition font-medium"
                                >
                                    로그인
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}