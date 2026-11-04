import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "신원위키",
  description: "소비자가 남긴 글을 메뉴, 가격, 운영시간으로 정리하는 신원시장 가게 위키",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${noto.className} antialiased`}>{children}</body>
    </html>
  );
}
