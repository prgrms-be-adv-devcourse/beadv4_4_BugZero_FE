'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useMemberStore } from '@/store/useMemberStore';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import NotificationDropdown from './Notification/NotificationDropdown';
import { ThemeToggle } from './ThemeToggle';

import toast from 'react-hot-toast';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { accessToken, role } = useAuthStore();
    const { isSeller, fetchMemberInfo, clearMemberInfo } = useMemberStore();
    const isLogin = !!accessToken;
    const isAdmin = role === 'ADMIN';
    const { unreadCount, connect, disconnect, fetchUnreadCount } = useNotificationStore();
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (isLogin) {
            fetchMemberInfo();
            connect();
            fetchUnreadCount();
        } else {
            clearMemberInfo();
            disconnect();
        }
    }, [isLogin, fetchMemberInfo, clearMemberInfo, connect, disconnect, fetchUnreadCount]);

    // 1. 로그인 여부와 상관없이 항상 노출되는 메뉴
    const publicNavItems = [
        { href: '/', label: '경매' },
        {
            href: isLogin ? (isSeller ? '/products/register' : '/seller/onboarding') : '/products/register',
            label: '판매'
        },
    ];

    // 2. 로그인 시에만 추가로 노출되는 메뉴 (관심, 마이페이지)
    const privateNavItems = [
        { href: '/wishlist', label: '관심' },
        { href: '/mypage', label: '마이페이지' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        // 판매 관련 경로는 하나로 취급하여 강조 처리
        if (href === '/products/register' || href === '/seller/onboarding') {
            return pathname === '/products/register' || pathname === '/seller/onboarding';
        }
        return pathname.startsWith(href);
    };

    // 판매하기 등 공용 메뉴 중 권한이 필요한 경우의 클릭 핸들러
    const handleProtectedClick = (e: React.MouseEvent, href: string) => {
        if (!isLogin && (href === '/products/register' || href === '/seller/onboarding')) {
            e.preventDefault();
            toast.error('판매 등록은 로그인 후 이용 가능합니다.');
            router.push('/login');
            return;
        }

        // 현재 이미 그 페이지라면 추가 동작 방지 (무한 새로고침 현상 방어)
        if (pathname === href) {
            e.preventDefault();
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
        <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
            <nav className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">

                    {/* 로고 섹션 */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image src="/main-logo.png" alt="RareGo Logo" width={48} height={48} className="w-12 h-12 rounded-lg transition-transform group-hover:scale-110 object-cover" />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-foreground">RareGo</span>
                            <span className="text-[10px] text-muted -mt-1 tracking-widest uppercase">
                                Rare Lego Auction
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-6 mr-4 border-r border-border pr-6">
                            {/* 공용 메뉴: 경매, 판매 */}
                            {publicNavItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={(e) => handleProtectedClick(e, item.href)}
                                    className={`text-sm transition font-medium ${isActive(item.href)
                                        ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1'
                                        : 'text-muted hover:text-foreground'
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
                                        : 'text-muted hover:text-foreground'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* 관리자 전용 메뉴 */}
                            {isAdmin && (
                                <Link
                                    href="/admin/inspection"
                                    className={`text-sm transition font-medium ${isActive('/admin/inspection')
                                        ? 'text-red-400 border-b-2 border-red-400 pb-1'
                                        : 'text-muted hover:text-red-400'
                                        }`}
                                >
                                    검수
                                </Link>
                            )}
                        </div>

                        <ThemeToggle />

                        {/* 알림 아이콘 (로그인 시) */}
                        {isLogin && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="text-muted hover:text-foreground transition p-2 relative"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-red-500 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                                )}
                            </div>
                        )}

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
                                        className="text-sm text-muted hover:text-red-400 transition font-medium"
                                    >
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-sm text-foreground bg-card hover:bg-gray-700 py-2 px-4 rounded-lg transition font-medium"
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