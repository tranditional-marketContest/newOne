import type { Metadata } from "next";
import { SectionScreen } from "@/components/section-screen";

export const metadata: Metadata = {
  title: "신원위키 · 신원시장",
};

export default function WikiPage() {
  return (
    <SectionScreen
      title="신원위키"
      lede="메뉴, 가격, 운영시간이 점포마다 달라 청년들이 시장을 지나칩니다. 손님이 가게 정보를 고치고, 정리된 안내로 다시 보여 줍니다."
      cards={[
        {
          title: "가게를 고르기",
          body: "목록에서 가게를 찾거나 검색한 뒤, 갱신할 가게를 누릅니다.",
        },
        {
          title: "손님이 남기는 기록",
          body: "사진과 글을 올리면 상점, 메뉴, 가격, 날짜로 정리됩니다.",
        },
        {
          title: "가격은 한 달에 한 번",
          body: "소비자 입력을 평균에 더하고, 사분위범위로 튀는 값을 뺀 뒤 약 한 달 주기로 갱신합니다.",
        },
      ]}
    />
  );
}
