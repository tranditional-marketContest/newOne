export const WIKI_CATEGORIES = [
  "반찬",
  "청과·채소",
  "정육·수산",
  "떡",
  "분식·간식",
  "닭강정",
  "순대·족발·전",
  "식료품",
] as const;

export type WikiCategory = (typeof WIKI_CATEGORIES)[number];

export type PriceSource = "prose" | "fields";

export type PricePoint = {
  amount: number;
  date: string;
  source?: PriceSource;
  /** 직접입력 시 구매 그람수. amount는 100g당 환산가. */
  grams?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  prices: PricePoint[];
};

export type Review = {
  id: string;
  text: string;
  date: string;
  purchaseHour?: string;
  purchasedItems?: string;
};

export type Store = {
  id: string;
  name: string;
  category: WikiCategory;
  hours: string;
  items: string;
  character: string;
  discount: string;
  note: string;
  photos: string[];
  reviews: Review[];
  menus: MenuItem[];
  updatedAt: string;
};

export type OrganizedWiki = {
  category: WikiCategory;
  hours: string;
  items: string;
  character: string;
  discount: string;
  note: string;
  menus: { name: string; price: number }[];
};

export type MenuDraft = {
  key: string;
  name: string;
  grams: string;
  price: string;
  custom?: boolean;
};

export type EditorDraft = {
  name: string;
  category: WikiCategory;
  hours: string;
  items: string;
  purchaseHour: string;
  purchasedItems: string;
  character: string;
  discount: string;
  note: string;
  date: string;
  photos: string[];
  text: string;
  menus: MenuDraft[];
};
