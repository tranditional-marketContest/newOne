import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", label: "전체", icon: "全" },
  { id: "식당", label: "식당", icon: "🍜" },
  { id: "간식", label: "간식", icon: "🍬" },
  { id: "식자재", label: "식자재", icon: "🥬" },
  { id: "생활용품", label: "생활용품", icon: "🧺" },
  { id: "의류", label: "의류", icon: "👕" },
  { id: "기타", label: "기타", icon: "📦" },
];

export const CATEGORY_EMOJI: Record<Exclude<CategoryId, "all">, string> = {
  식당: "🍜",
  간식: "🍡",
  식자재: "🥬",
  생활용품: "🧺",
  의류: "👕",
  기타: "📦",
};

const LEGACY_CATEGORY: Record<string, Exclude<CategoryId, "all">> = {
  food: "식자재",
  clothes: "의류",
  snack: "간식",
  kitchen: "생활용품",
  tools: "기타",
  etc: "기타",
};

export function migrateCategory(
  category: string,
  postId?: string,
): Exclude<CategoryId, "all"> {
  if (postId === "post-2") return "식당";
  if (postId === "post-7") return "생활용품";
  if (CATEGORIES.some((item) => item.id === category && item.id !== "all")) {
    return category as Exclude<CategoryId, "all">;
  }
  return LEGACY_CATEGORY[category] ?? "기타";
}
