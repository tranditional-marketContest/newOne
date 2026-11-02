export const CATEGORIES = ["전체", "식당", "생활용품", "간식", "의류", "기타"] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];
export type StoreCategory = Exclude<CategoryFilter, "전체">;

export type Store = {
  id: string;
  name: string;
  category: StoreCategory;
  x: number;
  y: number;
  place: string;
  summary: string;
  description: string;
  notes: string[];
};

export const stores: Store[] = [
  {
    id: "sundae",
    name: "소문난순대국",
    category: "식당",
    x: 40,
    y: 28,
    place: "순대·족발 골목",
    summary: "순대국과 포장 순대",
    description:
      "족발·전·포장순대를 내는 골목의 순대국 가게입니다. 시장에서 바로 포장해 갈 수 있습니다.",
    notes: ["순대국", "포장 순대"],
  },
  {
    id: "jangteo",
    name: "장터순대국",
    category: "식당",
    x: 62,
    y: 28,
    place: "순대·족발 골목",
    summary: "국물 중심의 순대국",
    description: "순대국을 중심으로 내는 식당입니다. 소문난순대국과 같은 순대 골목에 있습니다.",
    notes: ["순대국"],
  },
  {
    id: "jokbal",
    name: "명성왕족발",
    category: "식당",
    x: 82,
    y: 28,
    place: "순대·족발 골목",
    summary: "족발을 중심으로 내는 가게",
    description: "족발을 중심으로 내는 가게입니다. 한 마리 단위가 부담되면 반띵 매칭으로 나눠 담을 수 있습니다.",
    notes: ["족발"],
  },
  {
    id: "otteok",
    name: "오떡순",
    category: "식당",
    x: 40,
    y: 48,
    place: "분식 좌판",
    summary: "시장 분식",
    description: "분식·간식 골목의 좌판입니다. 떡볶이와 순대를 함께 내는 곳으로 정리되어 있습니다.",
    notes: ["분식"],
  },
  {
    id: "hotteok",
    name: "신원 호떡",
    category: "간식",
    x: 62,
    y: 48,
    place: "간식 통로",
    summary: "골목에서 바로 굽는 호떡",
    description: "신원시장의 호떡 좌판입니다. 별빛내린천을 걷다 들르기 좋은 간식 동선에 있습니다.",
    notes: ["호떡"],
  },
  {
    id: "tteok",
    name: "신림당떡집",
    category: "간식",
    x: 82,
    y: 48,
    place: "떡 좌판",
    summary: "아침에 친 떡, 당일 소진",
    description: "떡 가게입니다. 반찬·청과·떡처럼 만든 날 안에 나가는 당일 소진형 품목입니다.",
    notes: ["당일 소진", "떡"],
  },
  {
    id: "gangjeong",
    name: "불꽃닭강정",
    category: "간식",
    x: 40,
    y: 68,
    place: "닭강정 좌판",
    summary: "주문하면 바로 튀기는 닭강정",
    description: "닭강정은 주문 즉시 조리합니다. 포장해 수변으로 나가 먹기 좋습니다.",
    notes: ["주문 즉시 조리"],
  },
  {
    id: "oil",
    name: "신림기름집",
    category: "생활용품",
    x: 62,
    y: 68,
    place: "식료품 통로",
    summary: "기름과 기본 식료품",
    description:
      "기름을 다루는 식료품 가게입니다. 유통기한이 길어, 당일 떨이보다는 집의 기본 살림에 가깝습니다.",
    notes: ["식료품", "긴 유통기한"],
  },
  {
    id: "china",
    name: "중국식품",
    category: "생활용품",
    x: 82,
    y: 68,
    place: "식료품 통로",
    summary: "두고 쓰는 중국식품",
    description: "유통기한이 긴 식품을 팝니다. 한 봉지가 크면 반띵으로 나눠 살 수 있습니다.",
    notes: ["식료품", "긴 유통기한"],
  },
  {
    id: "banchan",
    name: "엄마손반찬",
    category: "기타",
    x: 40,
    y: 88,
    place: "반찬 골목",
    summary: "그날 만든 반찬",
    description: "반찬 가게입니다. 만든 날 안에 나가는 당일 소진형이라, 저녁 장보기에 맞습니다.",
    notes: ["당일 소진", "반찬"],
  },
  {
    id: "fruit",
    name: "영광과일",
    category: "기타",
    x: 62,
    y: 88,
    place: "청과 좌판",
    summary: "그날 들어온 과일",
    description: "청과 가게입니다. 과일과 채소는 당일 소진형 품목으로 정리되어 있습니다.",
    notes: ["당일 소진", "청과"],
  },
  {
    id: "meat",
    name: "건우축산",
    category: "기타",
    x: 82,
    y: 88,
    place: "정육 좌판",
    summary: "필요한 만큼 덜어 가는 고기",
    description: "정육 가게입니다. 한 근이 많으면 반띵 매칭으로 이웃과 나눠 담을 수 있습니다.",
    notes: ["정육"],
  },
];

export const stallTone: Record<StoreCategory, { fill: string; shade: string }> = {
  식당: { fill: "#F3C4B0", shade: "#E08B6E" },
  생활용품: { fill: "#E6D4B0", shade: "#C9A56A" },
  간식: { fill: "#F8DC93", shade: "#E3B34A" },
  의류: { fill: "#E4D4EA", shade: "#C09EC8" },
  기타: { fill: "#D5E3D2", shade: "#8FB08A" },
};

export function storesIn(category: CategoryFilter) {
  if (category === "전체") return stores;
  return stores.filter((store) => store.category === category);
}

export function findStore(id: string) {
  return stores.find((store) => store.id === id) ?? null;
}
