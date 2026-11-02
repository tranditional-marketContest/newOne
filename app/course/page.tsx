import type { Metadata } from "next";
import { SectionScreen } from "@/components/section-screen";

export const metadata: Metadata = {
  title: "코스 추천 · 신원시장",
};

export default function CoursePage() {
  return (
    <SectionScreen
      title="코스 추천"
      lede="별빛내린천에서 시장으로 들어오는 동선을 골라 줍니다. 점포 운영시간과 혼잡도를 함께 봐서, 한 가게에만 사람이 몰리지 않게 나눕니다."
      cards={[
        {
          title: "빠른 코스",
          body: "이색 데이트, 관광 필수, 식도락, 마실 코스 중 하나를 고르면 바로 동선이 나옵니다.",
        },
        {
          title: "맞춤 코스",
          body: "연령대, 소비 성향, 동행, 날씨, 분위기를 대화로 물은 뒤 코스를 제안합니다.",
        },
        {
          title: "지도 위 길안내",
          body: "추천 점포만 순서대로 남기고, 어느 출입구로 들어가 어느 방향으로 가는지 단계별로 보여 줍니다.",
        },
      ]}
    />
  );
}
