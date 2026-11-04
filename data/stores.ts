export const STORE_CATEGORIES = [
  "식당",
  "생활용품",
  "간식",
  "의류",
  "식자재",
  "기타",
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

export type Store = {
  id: string;
  name: string;
  category: StoreCategory;
  /** 지도 좌표 (0~100 비율) */
  x: number;
  y: number;
};

export const SEED_STORES: Store[] = [
  {
    id: "seed-yeongwang",
    name: "영광과일",
    category: "식자재",
    x: 38,
    y: 42,
  },
  {
    id: "seed-gwailnara",
    name: "과일나라",
    category: "식자재",
    x: 52,
    y: 48,
  },
];

export const STORES_STORAGE_KEY = "newone-market-stores-v2";

export function isStoreCategory(value: unknown): value is StoreCategory {
  return (
    typeof value === "string" &&
    (STORE_CATEGORIES as readonly string[]).includes(value)
  );
}
