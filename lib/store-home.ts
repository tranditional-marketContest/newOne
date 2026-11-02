import { menuBaseName } from "./menu-board";
import { isVagueMenuName } from "./organize";
import type { Store } from "./types";

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/** 가게 홈은 리뷰·가격 제보로만 채운다. 이름·분야만 기본으로 둔다. */
export function buildStoreHome(store: Store): Store {
  const reviews = store.reviews ?? [];
  if (reviews.length === 0) {
    return {
      ...store,
      hours: "",
      items: "",
      character: "",
      discount: "",
      note: "",
      photos: [],
      menus: [],
      updatedAt: "",
    };
  }

  const menus = store.menus.filter(
    (menu) => menu.prices.length > 0 && !isVagueMenuName(menu.name),
  );
  const itemNames = unique([
    ...menus.map((menu) => menuBaseName(menu.name) || menu.name),
    ...reviews.flatMap((review) => (review.purchasedItems ?? "").split(",")),
  ]).filter((name) => !isVagueMenuName(name));

  const prose = reviews
    .filter((review) => review.text.trim())
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const noteBits: string[] = [];
  for (const review of prose) {
    if (/포장/.test(review.text)) noteBits.push("포장 가능");
    if (/카드/.test(review.text)) noteBits.push("카드 결제");
  }

  const hourMatch = prose
    .map((review) => review.text.match(/((?:오전|오후)?\s*\d{1,2}\s*시[^.]{0,20}(?:저녁|밤|오후)?\s*\d{0,2}\s*시?)/))
    .find(Boolean);

  const latestDate = reviews
    .map((review) => review.date)
    .concat(menus.flatMap((menu) => menu.prices.map((point) => point.date)))
    .sort()
    .at(-1);

  return {
    ...store,
    menus,
    items: itemNames.join(", "),
    // Gemini가 후기 전체로 정리해 둔 요약만 쓴다.
    character: store.character.trim(),
    hours: hourMatch?.[1]?.replace(/\s+/g, " ").trim() || "",
    discount: "",
    note: unique(noteBits).join(", "),
    photos: store.photos,
    updatedAt: latestDate || "",
  };
}
