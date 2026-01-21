'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', label: '경매' },
    { href: '/wishlist', label: '관심' },
    { href: '/products/register', label: '판매' },
    { href: '/mypage', label: 'MY' },
];

export default function Header() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <header className="border-b border-[#1a1a1a] sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
            <nav className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="text-2xl">🧱</span>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight">RareGo</span>
                            <span className="text-[10px] text-gray-500 -mt-1 tracking-widest uppercase">Rare Lego Auction</span>
                        </div>
                    </Link>

                    {/* Nav */}
                    <div className="flex items-center gap-6">
                        {navItems.map((item) => (
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
                        <Link href="/payment" className="lego-btn text-sm py-2 px-4 text-black">
                            충전
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}
