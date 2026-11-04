export const WIKI_CATEGORIES = [
  "식당",
  "생활용품",
  "간식",
  "의류",
  "식자재",
  "기타",
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
