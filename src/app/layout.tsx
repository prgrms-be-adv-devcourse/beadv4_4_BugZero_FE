import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Image from "next/image";
import AuthInitializer from "@/components/AuthInitializer"; // ✅ 추가
import WishlistInitializer from "@/components/WishlistInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RareGo - 희귀 레고 경매",
  description: "한정판, 단종품, 빈티지 레고를 경매로 만나보세요",
};

import { Toaster } from "react-hot-toast"; // ✅ 추가
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster // ✅ 토스트 설정
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px border #333',
              },
            }}
          />
          <AuthInitializer /> {/* ✅ 최상단에 배치하여 앱 구동 시 권한 체크 */}
          <WishlistInitializer /> {/* ✅ 로그인 시 관심 목록 동기화 */}
          <Header />
          <main className="container mx-auto px-6 py-8 flex-1">{children}</main>

          <footer className="border-t border-border mt-auto">
            <div className="container mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted">
              <div className="flex items-center gap-2">
                <Image src="/main-logo.png" alt="Footer Logo" width={32} height={32} className="w-8 h-8 rounded-md object-cover" />
                <span>RareGo</span>
              </div>
              <p>© 2026 BugZero</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}