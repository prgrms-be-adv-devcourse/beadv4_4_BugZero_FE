import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RareGo - 희귀 레고 경매",
  description: "한정판, 단종품, 빈티지 레고를 경매로 만나보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <Header />
        <main className="container mx-auto px-6 py-8 flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#1a1a1a] mt-auto">
          <div className="container mx-auto px-6 py-6 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧱</span>
              <span>RareGo</span>
            </div>
            <p>© 2026 BugZero</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
