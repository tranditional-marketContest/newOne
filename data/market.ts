export type StoreCategory = string;

export type Store = {
  id: string;
  name: string;
  category: StoreCategory;
  x: number;
  y: number;
  hours: string;
  items: string;
  character: string;
  discount: string;
  note: string;
  photos: string[];
};

export type StoreRow = Omit<Store, "x" | "y">;

const CATEGORY_ORDER = ["식당", "간식", "식자재", "생활용품", "의류", "기타"];

const COLUMNS = [40, 62, 82];
const ROWS = [18, 26, 34, 42, 50, 70, 78, 86, 94, 102];

const tones: Record<string, { fill: string; shade: string }> = {
  식당: { fill: "#F3C4B0", shade: "#E08B6E" },
  간식: { fill: "#F8DC93", shade: "#E3B34A" },
  식자재: { fill: "#D5E3D2", shade: "#8FB08A" },
  생활용품: { fill: "#E6D4B0", shade: "#C9A56A" },
  의류: { fill: "#E4D4EA", shade: "#C09EC8" },
  기타: { fill: "#E7D4C4", shade: "#C4A48E" },
};

export function stallTone(category: string) {
  return tones[category] ?? { fill: "#E6D4B0", shade: "#C9A56A" };
}

export function categoryFilters(stores: Store[]) {
  const present = new Set(stores.map((store) => store.category));
  const ordered = CATEGORY_ORDER.filter((category) => present.has(category));
  for (const category of present) {
    if (!ordered.includes(category)) ordered.push(category);
  }
  return ["전체", ...ordered];
}

export function placeStores(rows: StoreRow[]) {
  const sorted = [...rows].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name, "ko"),
  );
  return sorted.map((store, index) => {
    const column = index % COLUMNS.length;
    const row = Math.floor(index / COLUMNS.length);
    return {
      ...store,
      x: COLUMNS[column] ?? COLUMNS[COLUMNS.length - 1],
      y: ROWS[row] ?? ROWS[ROWS.length - 1],
    };
  });
}

export function storesIn(stores: Store[], category: string) {
  if (category === "전체") return stores;
  return stores.filter((store) => store.category === category);
}

export function findStore(stores: Store[], id: string) {
  return stores.find((store) => store.id === id) ?? null;
}

export function storeSummary(store: Store) {
  return store.character || store.items || store.note || "소개가 아직 없습니다";
}

export function storeTags(store: Store) {
  return [store.items, store.discount, store.note].map((value) => value.trim()).filter(Boolean);
}

function categoryRank(category: string) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}
