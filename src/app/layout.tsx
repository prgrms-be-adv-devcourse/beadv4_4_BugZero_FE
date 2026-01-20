import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RareGo - 레고 경매",
  description: "희귀 레고 제품을 경매로 만나보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen`}
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-yellow-500 to-red-600 shadow-lg sticky top-0 z-50">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-3xl">🧱</span>
                <span className="text-2xl font-bold text-white drop-shadow-md">
                  RareGo
                </span>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-white hover:text-yellow-200 transition font-medium"
                >
                  경매
                </Link>
                <Link
                  href="/wishlist"
                  className="text-white hover:text-yellow-200 transition font-medium"
                >
                  💛
                </Link>
                <Link
                  href="/products/register"
                  className="text-white hover:text-yellow-200 transition font-medium"
                >
                  판매
                </Link>
                <Link
                  href="/mypage"
                  className="text-white hover:text-yellow-200 transition font-medium"
                >
                  MY
                </Link>
                <Link
                  href="/payment"
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-100 transition shadow-md"
                >
                  💰
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
                >
                  로그인
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-gray-400">
            <p className="flex items-center justify-center gap-2">
              <span className="text-2xl">🧱</span>
              <span>RareGo - 희귀 레고 경매 플랫폼</span>
            </p>
            <p className="text-sm mt-2">© 2026 BugZero Team. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
