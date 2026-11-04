import type { Metadata, Viewport } from "next";
<<<<<<< HEAD
import "./globals.css";

export const metadata: Metadata = {
  title: "new-one",
  description:
    "별빛내린천과 이어지는 신원시장 지도. 가게를 찾고, 위키와 코스, 반띵 매칭으로 이어집니다.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {children}
      </body>
=======
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "신원시장 · newOne",
  description: "신원시장 모바일 웹",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={notoSansKr.className}>{children}</body>
>>>>>>> origin/seohyeon_logIn
    </html>
  );
}
