import { isVagueMenuName } from "@/lib/organize";
import type {
  EditorDraft,
  MenuItem,
  OrganizedWiki,
  PriceSource,
  Review,
  Store,
  WikiCategory,
} from "@/lib/types";
import { WIKI_CATEGORIES } from "@/lib/types";
import { getSupabase } from "./client";

type StoreRow = {
  id: string;
  name: string;
  category: WikiCategory;
  hours: string;
  items: string;
  character: string;
  discount: string;
  note: string;
  photos: unknown;
  updated_at: string | null;
};

type ReviewRow = {
  id: string;
  store_id: string;
  text: string;
  visited_date: string;
  purchase_hour: string | null;
  purchased_items: string | null;
};

type PriceRow = {
  store_id: string;
  menu_name: string;
  amount: number;
  grams: number | null;
  source: PriceSource | null;
  visited_date: string;
};

function asCategory(value: string): WikiCategory {
  return WIKI_CATEGORIES.find((item) => item === value) ?? "기타";
}

function asPhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function money(value: string): number | null {
  const amount = Number(value.replace(/,/g, "").trim());
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount);
}

function gramsOf(value: string): number {
  const grams = Math.round(Number(value.replace(/,/g, "").trim()));
  if (!Number.isFinite(grams) || grams <= 0) return 100;
  return grams;
}

/** menu-board의 asPer100g는 이름만 다루므로 여기서 동일 규칙 사용 */
function toPer100gName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (/100\s*g$/i.test(trimmed)) return trimmed;
  return `${trimmed.replace(/\s*100\s*g$/i, "").trim()} 100g`;
}

export async function fetchStoresFromSupabase(): Promise<Store[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [{ data: storeRows, error: storeError }, { data: reviewRows, error: reviewError }, { data: priceRows, error: priceError }] =
    await Promise.all([
      supabase.from("stores").select("*").order("name"),
      supabase.from("reviews").select("*").order("visited_date", { ascending: false }),
      supabase.from("menu_prices").select("*").order("visited_date", { ascending: false }),
    ]);

  if (storeError || reviewError || priceError || !storeRows) {
    console.error(storeError ?? reviewError ?? priceError);
    return null;
  }

  const reviewsByStore = new Map<string, Review[]>();
  for (const row of (reviewRows ?? []) as ReviewRow[]) {
    const list = reviewsByStore.get(row.store_id) ?? [];
    list.push({
      id: row.id,
      text: row.text ?? "",
      date: row.visited_date,
      ...(row.purchase_hour ? { purchaseHour: row.purchase_hour } : {}),
      ...(row.purchased_items ? { purchasedItems: row.purchased_items } : {}),
    });
    reviewsByStore.set(row.store_id, list);
  }

  const menusByStore = new Map<string, Map<string, MenuItem>>();
  for (const row of (priceRows ?? []) as PriceRow[]) {
    const byName = menusByStore.get(row.store_id) ?? new Map<string, MenuItem>();
    const name = row.menu_name;
    const current =
      byName.get(name) ??
      ({
        id: `${row.store_id}-${name}`,
        name,
        prices: [],
      } satisfies MenuItem);
    current.prices.push({
      amount: row.amount,
      date: row.visited_date,
      ...(row.source ? { source: row.source } : {}),
      ...(row.grams && row.grams !== 100 ? { grams: row.grams } : {}),
    });
    byName.set(name, current);
    menusByStore.set(row.store_id, byName);
  }

  return (storeRows as StoreRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    category: asCategory(row.category),
    hours: row.hours ?? "",
    items: row.items ?? "",
    character: row.character ?? "",
    discount: row.discount ?? "",
    note: row.note ?? "",
    photos: asPhotos(row.photos),
    reviews: reviewsByStore.get(row.id) ?? [],
    menus: [...(menusByStore.get(row.id)?.values() ?? [])],
    updatedAt: row.updated_at ?? "",
  }));
}

export async function syncStoresToSupabase(stores: Store[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || stores.length === 0) return false;

  const payload = stores.map((store) => ({
    id: store.id,
    name: store.name,
    category: store.category,
    hours: store.hours,
    items: store.items,
    character: store.character,
    discount: store.discount,
    note: store.note,
    photos: store.photos,
    updated_at: store.updatedAt || null,
  }));

  const { error } = await supabase.from("stores").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error(error);
    return false;
  }

  for (const store of stores) {
    const reviewCount = store.reviews?.length ?? 0;
    const priceRows = (store.menus ?? []).flatMap((menu) =>
      menu.prices.map((point) => ({
        store_id: store.id,
        menu_name: menu.name,
        amount: point.amount,
        grams: point.grams ?? null,
        source: point.source ?? null,
        visited_date: point.date,
      })),
    );
    if (reviewCount === 0 && priceRows.length === 0) continue;

    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);
    if ((count ?? 0) > 0) continue;

    if (reviewCount > 0) {
      const { error: reviewError } = await supabase.from("reviews").insert(
        store.reviews.map((review) => ({
          store_id: store.id,
          text: review.text,
          visited_date: review.date,
          purchase_hour: review.purchaseHour ?? null,
          purchased_items: review.purchasedItems ?? null,
        })),
      );
      if (reviewError) console.error(reviewError);
    }
    if (priceRows.length > 0) {
      const { error: priceError } = await supabase.from("menu_prices").insert(priceRows);
      if (priceError) console.error(priceError);
    }
  }

  return true;
}

export async function seedStoresToSupabase(stores: Store[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const payload = stores.map((store) => ({
    id: store.id,
    name: store.name,
    category: store.category,
    hours: store.hours,
    items: store.items,
    character: store.character,
    discount: store.discount,
    note: store.note,
    photos: store.photos,
    updated_at: store.updatedAt || null,
  }));

  const { error } = await supabase.from("stores").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error(error);
    return false;
  }

  // 시드 후기·가격 (건우축산 등) — 이미 있으면 중복 삽입 방지 위해 리뷰 0개일 때만
  for (const store of stores) {
    if (store.reviews.length === 0 && store.menus.every((menu) => menu.prices.length === 0)) continue;

    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);
    if ((count ?? 0) > 0) continue;

    if (store.reviews.length > 0) {
      const { error: reviewError } = await supabase.from("reviews").insert(
        store.reviews.map((review) => ({
          store_id: store.id,
          text: review.text,
          visited_date: review.date,
          purchase_hour: review.purchaseHour ?? null,
          purchased_items: review.purchasedItems ?? null,
        })),
      );
      if (reviewError) console.error(reviewError);
    }

    const priceRows = store.menus.flatMap((menu) =>
      menu.prices.map((point) => ({
        store_id: store.id,
        menu_name: menu.name,
        amount: point.amount,
        grams: point.grams ?? null,
        source: point.source ?? null,
        visited_date: point.date,
      })),
    );
    if (priceRows.length > 0) {
      const { error: priceError } = await supabase.from("menu_prices").insert(priceRows);
      if (priceError) console.error(priceError);
    }
  }

  return true;
}

export async function persistWikiSubmission(input: {
  store: Store;
  draft: EditorDraft;
  organized: OrganizedWiki | null;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Supabase 환경 변수가 없습니다." };

  const { store, draft, organized } = input;
  const visitedDate = /^\d{4}-\d{2}-\d{2}$/.test(draft.date) ? draft.date : store.updatedAt;
  const reviewText = draft.text.trim();
  const purchaseHour = draft.purchaseHour.trim();
  const menuNames = draft.menus.map((row) => row.name.trim()).filter(Boolean);
  const purchasedItems =
    draft.purchasedItems.trim() || (!organized ? menuNames.join(", ") : "");

  const { error: storeError } = await supabase.from("stores").upsert(
    {
      id: store.id,
      name: store.name,
      category: store.category,
      hours: store.hours,
      items: store.items,
      character: store.character,
      discount: store.discount,
      note: store.note,
      photos: store.photos,
      updated_at: store.updatedAt || visitedDate || null,
    },
    { onConflict: "id" },
  );
  if (storeError) return { ok: false, message: storeError.message };

  let reviewId: string | null = null;
  const shouldInsertReview =
    Boolean(reviewText) ||
    Boolean(purchaseHour) ||
    Boolean(purchasedItems) ||
    draft.menus.some((row) => row.name.trim() && money(row.price));

  if (shouldInsertReview) {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        store_id: store.id,
        text: reviewText,
        visited_date: visitedDate,
        purchase_hour: purchaseHour || null,
        purchased_items: purchasedItems || null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, message: error.message };
    reviewId = data.id as string;
  }

  if (organized && reviewId) {
    const { error } = await supabase.from("review_summaries").insert({
      review_id: reviewId,
      category: organized.category,
      hours: organized.hours,
      items: organized.items,
      character: organized.character,
      discount: organized.discount,
      note: organized.note,
      menus: organized.menus,
      source: "gemini",
    });
    if (error) return { ok: false, message: error.message };

    const prosePrices = organized.menus
      .filter((row) => row.name.trim() && !isVagueMenuName(row.name) && row.price > 0)
      .map((row) => ({
        store_id: store.id,
        menu_name: toPer100gName(row.name),
        amount: Math.round(row.price),
        grams: null,
        source: "prose" as const,
        visited_date: visitedDate,
        review_id: reviewId,
      }));
    if (prosePrices.length > 0) {
      const { error: priceError } = await supabase.from("menu_prices").insert(prosePrices);
      if (priceError) return { ok: false, message: priceError.message };
    }
  }

  if (!organized) {
    const fieldPrices = draft.menus
      .map((row) => {
        if (!row.name.trim() || isVagueMenuName(row.name)) return null;
        const total = money(row.price);
        if (!total) return null;
        const grams = gramsOf(row.grams);
        return {
          store_id: store.id,
          menu_name: toPer100gName(row.name),
          amount: Math.max(1, Math.round((total / grams) * 100)),
          grams: grams === 100 ? null : grams,
          source: "fields" as const,
          visited_date: visitedDate,
          review_id: reviewId,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (fieldPrices.length > 0) {
      const { error } = await supabase.from("menu_prices").insert(fieldPrices);
      if (error) return { ok: false, message: error.message };
    }
  }

  return { ok: true };
}
