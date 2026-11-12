import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", label: "전체", icon: "全" },
  { id: "food", label: "음식", icon: "🍴" },
  { id: "clothes", label: "의류", icon: "👕" },
  { id: "snack", label: "간식", icon: "🍬" },
  { id: "kitchen", label: "주방·생활", icon: "🍲" },
  { id: "tools", label: "공구·잡화", icon: "🔧" },
  { id: "etc", label: "기타", icon: "📦" },
];

export const CATEGORY_EMOJI: Record<Exclude<CategoryId, "all">, string> = {
  food: "🍊",
  clothes: "🧦",
  snack: "🍡",
  kitchen: "🥘",
  tools: "🪛",
  etc: "📦",
};
