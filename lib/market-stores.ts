import { shops } from "@/lib/course";
import { seedStores, STORE_STORAGE_KEY } from "@/lib/seed";
import { getSupabase } from "@/lib/supabase/client";
import type { MenuItem, Store as WikiStore } from "@/lib/types";
import { inferUnitFromName, isPriceUnit, menuIdentityKey, normalizeMenuName } from "@/lib/units";
import type { Store, StoreRow } from "@/data/market";

const knownPoints = new Map(
  shops.filter((shop) => shop.kind !== "place").map((shop) => [shop.name, { x: shop.x, y: shop.y }]),
);

function lanePoint(index: number) {
  const t = (index % 12) / 12;
  const lane = ((index % 3) - 1) as -1 | 0 | 1;
  return {
    x: Math.round((32 + t * 18 - lane * 1.8) * 10) / 10,
    y: Math.round((38 + t * 34 + lane * 1.2) * 10) / 10,
  };
}

export function placeOnBlockMap(rows: StoreRow[]): Store[] {
  return rows.map((row, index) => {
    const point = knownPoints.get(row.name) ?? lanePoint(index);
    return { ...row, x: point.x, y: point.y };
  });
}

function wikiToRows(stores: WikiStore[]): StoreRow[] {
  return stores.map((store) => ({
    id: store.id,
    name: store.name,
    category: store.category,
    hours: store.hours ?? "",
    items: store.items ?? "",
    character: store.character ?? "",
    discount: store.discount ?? "",
    note: store.note ?? "",
    photos: Array.isArray(store.photos) ? store.photos : [],
  }));
}

export function wikiStoresOnMap(stores: WikiStore[]): Store[] {
  return placeOnBlockMap(wikiToRows(stores));
}

export function seedStoresOnMap(): Store[] {
  return wikiStoresOnMap(seedStores);
}

const menusByStoreId = new Map<string, MenuItem[]>();

function storedWikiStores(): WikiStore[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WikiStore[];
  } catch {
    return [];
  }
}

export function menusForMarketStore(store: { id: string; name: string }): MenuItem[] {
  const remote = menusByStoreId.get(store.id);
  if (remote && remote.length > 0) return remote;
  const matches = [...storedWikiStores(), ...seedStores].filter(
    (item) => item.id === store.id || item.name === store.name,
  );
  return matches.find((item) => (item.menus?.length ?? 0) > 0)?.menus ?? matches[0]?.menus ?? [];
}

function rememberMenus(
  rows: {
    store_id: string;
    menu_name: string;
    amount: number;
    grams: number | null;
    source: "prose" | "fields" | null;
    visited_date: string;
    unit?: string | null;
  }[],
) {
  const grouped = new Map<string, Map<string, MenuItem>>();
  for (const row of rows) {
    const byKey = grouped.get(row.store_id) ?? new Map<string, MenuItem>();
    const name = normalizeMenuName(row.menu_name) || row.menu_name;
    const unit = isPriceUnit(row.unit) ? row.unit : inferUnitFromName(row.menu_name);
    const key = menuIdentityKey(name, unit);
    const current = byKey.get(key) ?? {
      id: `${row.store_id}-${key}`,
      name,
      unit,
      prices: [],
    };
    current.prices.push({
      amount: row.amount,
      date: row.visited_date,
      ...(row.source ? { source: row.source } : {}),
      ...(row.grams && row.grams !== 100 ? { grams: row.grams } : {}),
    });
    byKey.set(key, current);
    grouped.set(row.store_id, byKey);
  }
  for (const [storeId, byKey] of grouped) {
    menusByStoreId.set(storeId, [...byKey.values()]);
  }
}

export function readWikiStoresFromBrowser(): Store[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return wikiStoresOnMap(parsed as WikiStore[]);
  } catch {
    return [];
  }
}

type RemoteStore = {
  id: string;
  name: string;
  category: string;
  hours: string | null;
  items: string | null;
  character: string | null;
  discount: string | null;
  note: string | null;
  photos: string[] | null;
};

export async function loadStoresForMap(): Promise<Store[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,category,hours,items,character,discount,note,photos")
        .order("name", { ascending: true });
      if (!error && data && data.length > 0) {
        const prices = await supabase
          .from("menu_prices")
          .select("store_id,menu_name,amount,grams,source,visited_date,unit");
        if (!prices.error && prices.data) {
          rememberMenus(prices.data as {
            store_id: string;
            menu_name: string;
            amount: number;
            grams: number | null;
            source: "prose" | "fields" | null;
            visited_date: string;
            unit?: string | null;
          }[]);
        }
        return placeOnBlockMap(
          (data as RemoteStore[]).map((record) => ({
            id: record.id,
            name: record.name,
            category: record.category,
            hours: record.hours?.trim() ?? "",
            items: record.items?.trim() ?? "",
            character: record.character?.trim() ?? "",
            discount: record.discount?.trim() ?? "",
            note: record.note?.trim() ?? "",
            photos: (record.photos ?? []).filter((photo) => photo.startsWith("https://")),
          })),
        );
      }
    } catch {
      // 위키에 등록된 가게로 넘어간다.
    }
  }

  const wiki = readWikiStoresFromBrowser();
  if (wiki.length > 0) return wiki;
  return seedStoresOnMap();
}
