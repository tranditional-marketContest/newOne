import type { Metadata } from "next";
import { SectionScreen } from "@/components/section-screen";

export const metadata: Metadata = {
  title: "반띵 매칭 · 신원시장",
};

export default function MatchingPage() {
  return (
    <SectionScreen
      title="반띵 매칭"
      lede="1인 가구에게 큰 단위 상품은 부담입니다. 같은 물건을 나눠 사려는 사람을 연결하고, 떨이가 아니어도 반띵할 수 있습니다."
      cards={[
        {
          title: "구인 글",
          body: "메뉴와 가게를 골라 글을 올리면 목록에 뜨고, 같은 키워드를 구독한 사람에게 알림이 갑니다.",
        },
        {
          title: "1대1 채팅",
          body: "글을 연 뒤 채팅으로 상을 맞춥니다. 매칭이 확정되면 글은 내려갑니다.",
        },
        {
          title: "맞춰 보는 기준",
          body: "가까운 출입구, 픽업 가능 시간, 과거 거래 신뢰도를 함께 봅니다.",
        },
      ]}
    />
  );
}
