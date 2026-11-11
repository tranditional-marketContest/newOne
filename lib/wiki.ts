import { shops } from "@/lib/course";
import { isRemovedStore, visibleNote } from "@/lib/store-pin";

export type WikiStore = {
  id: string;
  name: string;
  category: string;
  hours: string;
  items: string;
  character: string;
  discount: string;
  note: string;
  reviews: WikiReview[];
};

type WikiReview = {
  store_id: string;
  text: string;
  visited_date: string | null;
  purchase_hour: string | null;
  purchased_items: string | null;
};

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase 설정이 없습니다. .env.local을 확인해 주세요.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseGet<T>(path: string): Promise<T> {
  const { url, key } = supabaseEnv();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("신원위키 가게 목록을 불러오지 못했습니다.");
  }
  return response.json() as Promise<T>;
}

function compact(name: string) {
  return name.replace(/\s+/g, "");
}

export function localShopIdForStoreName(name: string) {
  const key = compact(name);
  return shops.find((item) => item.kind !== "place" && compact(item.name) === key)?.id ?? null;
}

function clip(text: string, max: number) {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export async function loadWikiStores(): Promise<WikiStore[]> {
  const [stores, reviews] = await Promise.all([
    supabaseGet<Omit<WikiStore, "reviews">[]>(
      "stores?select=id,name,category,hours,items,character,discount,note&order=name.asc",
    ),
    supabaseGet<WikiReview[]>(
      "reviews?select=store_id,text,visited_date,purchase_hour,purchased_items&order=visited_date.desc",
    ),
  ]);

  const reviewsByStore = new Map<string, WikiReview[]>();
  for (const review of reviews) {
    const list = reviewsByStore.get(review.store_id) ?? [];
    if (list.length < 3) list.push(review);
    reviewsByStore.set(review.store_id, list);
  }

  return stores
    .filter((store) => !isRemovedStore(store.note))
    .map((store) => ({
      ...store,
      note: visibleNote(store.note),
      reviews: reviewsByStore.get(store.id) ?? [],
    }));
}

export function wikiCatalog(stores: WikiStore[]) {
  return stores
    .filter((store) => {
      const localId = localShopIdForStoreName(store.name);
      const local = shops.find((item) => item.id === localId);
      return local && local.stars > 0;
    })
    .map((store) => {
      const localId = localShopIdForStoreName(store.name);
      const local = shops.find((item) => item.id === localId);
      const facts = [
        store.hours && `영업 ${clip(store.hours, 40)}`,
        store.items && `품목 ${clip(store.items, 40)}`,
        store.character && `소개 ${clip(store.character, 120)}`,
        store.discount && `할인 ${clip(store.discount, 40)}`,
        store.note && `비고 ${clip(store.note, 40)}`,
        local?.crowd === "혼잡" ? "줄이 길 수 있음" : "",
        ...store.reviews.map((review) => {
          const extra = [review.purchased_items, review.purchase_hour].filter(Boolean).join(" ");
          return `후기 ${clip(`${review.text}${extra ? ` (${extra})` : ""}`, 100)}`;
        }),
      ].filter(Boolean);
      const detail = facts.length > 0 ? facts.join(" | ") : "소개와 후기가 아직 없습니다. 카테고리로 판단";
      return `${store.id} | ${store.name} | ${store.category} | ${detail}`;
    })
    .join("\n");
}

export function wikiIdsToLocalIds(ids: string[], stores: WikiStore[]) {
  const localIds: string[] = [];
  for (const id of ids) {
    const place = shops.find((item) => item.id === id && item.kind === "place");
    if (place) {
      localIds.push(place.id);
      continue;
    }
    const store = stores.find((item) => item.id === id) ?? stores.find((item) => compact(item.name) === compact(id));
    const localId = store ? localShopIdForStoreName(store.name) : shops.find((item) => item.id === id)?.id;
    const local = shops.find((item) => item.id === localId);
    if (!local || local.stars === 0 || local.kind === "place") continue;
    localIds.push(local.id);
  }
  return localIds;
}
