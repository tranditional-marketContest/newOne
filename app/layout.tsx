import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "신원시장",
  description:
    "별빛내린천과 이어지는 신원시장 지도. 가게를 찾고, 위키와 코스, 반띵 매칭으로 이어집니다.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className={`${noto.className} min-h-dvh bg-background font-sans text-foreground`}>
        {children}
      </body>
    </html>
  );
}
