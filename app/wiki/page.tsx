import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import WikiApp from "@/components/WikiApp";

export const metadata: Metadata = {
  title: "신원위키 · 신원시장",
  description: "소비자가 남긴 글을 메뉴, 가격, 운영시간으로 정리하는 신원시장 가게 위키",
};

export default function WikiPage() {
  return (
    <AppFrame>
      <WikiApp />
    </AppFrame>
  );
}
