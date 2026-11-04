import { redirect } from "next/navigation";

/** 이 브랜치 단독 실행 시 홈이 없으므로 마이페이지로 보냄. merge 후 home의 page가 `/`를 담당한다. */
export default function RootPage() {
  redirect("/mypage");
}
