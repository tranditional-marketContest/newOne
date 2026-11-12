import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import { AppFrame } from "@/src/components/AppFrame";
import { MatchingStoreProvider } from "@/src/lib/matching-store";
import "./globals.css";

const display = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "반띵 매칭 | 신원시장",
  description:
    "혼자 사기 부담스러운 상품을 이웃과 나눠 사는 신원시장 반띵 매칭",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#996F45",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <MatchingStoreProvider>
          <AppFrame>
            <div className="app-shell">{children}</div>
          </AppFrame>
        </MatchingStoreProvider>
      </body>
    </html>
  );
}
