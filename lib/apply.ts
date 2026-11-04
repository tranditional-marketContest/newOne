import { isPer100g, menuBaseName } from "./menu-board";
import { isVagueMenuName } from "./organize";
import { seoulToday } from "./price";
import type { EditorDraft, MenuItem, OrganizedWiki, PriceSource, Review, Store } from "./types";

function money(value: string): number | null {
  const amount = Number(value.replace(/,/g, "").trim());
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount);
}

function pushPrice(
  menu: MenuItem,
  amount: number,
  date: string,
  source?: PriceSource,
  grams?: number,
) {
  const exists = menu.prices.some(
    (point) =>
      point.amount === amount &&
      point.date === date &&
      point.source === source &&
      (point.grams ?? 100) === (grams ?? 100),
  );
  if (!exists) {
    menu.prices.push({
      amount,
      date,
      ...(source ? { source } : {}),
      ...(grams && grams !== 100 ? { grams } : {}),
    });
  }
}

function gramsOf(value: string): number {
  const grams = Math.round(Number(value.replace(/,/g, "").trim()));
  if (!Number.isFinite(grams) || grams <= 0) return 100;
  return grams;
}

/** 가격은 모두 100g당으로 맞춘다. */
function asPer100gName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (isPer100g(trimmed)) return trimmed;
  return `${menuBaseName(trimmed)} 100g`;
}

export function applyDraft(store: Store, draft: EditorDraft, organized: OrganizedWiki | null): Store {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.date) ? draft.date : seoulToday();
  const reviewText = draft.text.trim();
  const purchaseHour = draft.purchaseHour.trim();
  const menuNames = draft.menus.map((row) => row.name.trim()).filter(Boolean);
  const purchasedItems = draft.purchasedItems.trim() || (!organized ? menuNames.join(", ") : "");
  const hasFieldPrices =
    !organized &&
    draft.menus.some((row) => row.name.trim() && money(row.price));
  const reviews: Review[] = [...(store.reviews ?? [])];
  if (reviewText || (!organized && (purchaseHour || purchasedItems || hasFieldPrices))) {
    reviews.push({
      id: crypto.randomUUID(),
      text: reviewText,
      date,
      ...(purchaseHour ? { purchaseHour } : {}),
      ...(purchasedItems ? { purchasedItems } : {}),
    });
  }
  const menus = new Map<string, MenuItem>();
  for (const menu of store.menus) {
    menus.set(menu.name.trim(), { ...menu, name: menu.name.trim(), prices: [...menu.prices] });
  }

  for (const row of draft.menus) {
    if (!row.name.trim() || isVagueMenuName(row.name)) continue;
    const name = asPer100gName(row.name);
    const base = menuBaseName(name);
    const current =
      menus.get(name) ??
      [...menus.values()].find((menu) => menuBaseName(menu.name) === base) ??
      store.menus.find(
        (menu) =>
          menu.id === row.key ||
          menu.name.trim() === name ||
          menuBaseName(menu.name) === base,
      );
    const next: MenuItem = current
      ? { ...current, name, prices: [...current.prices] }
      : { id: row.key, name, prices: [] };
    if (current && current.name !== name) menus.delete(current.name);
    const total = money(row.price);
    const grams = gramsOf(row.grams);
    if (total) {
      // 총 가격 ÷ 그람수 × 100 → 100g당
      const unitPrice = Math.max(1, Math.round((total / grams) * 100));
      pushPrice(next, unitPrice, date, organized ? undefined : "fields", grams);
    }
    menus.set(name, next);
  }

  if (organized) {
    for (const row of organized.menus) {
      if (!row.name.trim() || isVagueMenuName(row.name) || row.price <= 0) continue;
      const name = asPer100gName(row.name);
      const base = menuBaseName(name);
      const current =
        menus.get(name) ??
        [...menus.values()].find((menu) => menuBaseName(menu.name) === base);
      const next: MenuItem = current
        ? { ...current, name, prices: [...current.prices] }
        : { id: crypto.randomUUID(), name, prices: [] };
      if (current && current.name !== name) menus.delete(current.name);
      pushPrice(next, row.price, date, "prose");
      menus.set(name, next);
    }
  }

  const filled = (organizedValue: string, draftValue: string) => organizedValue.trim() || draftValue.trim();
  const mergedItems = (() => {
    const parts = [...store.items.split(","), ...(organized?.items ?? "").split(",")]
      .map((part) => part.trim())
      .filter(Boolean);
    return [...new Set(parts)].join(", ");
  })();

  return {
    ...store,
    name: draft.name.trim() || store.name,
    category: organized?.category ?? draft.category,
    hours: organized ? filled(organized.hours, store.hours) : store.hours,
    items: organized ? mergedItems : store.items,
    character: organized
      ? filled(organized.character, draft.character) || store.character
      : draft.character.trim() || store.character,
    discount: organized
      ? filled(organized.discount, draft.discount) || store.discount
      : draft.discount.trim() || store.discount,
    note: organized
      ? filled(organized.note, draft.note) || store.note
      : draft.note.trim() || store.note,
    photos: [...store.photos, ...draft.photos].slice(0, 4),
    reviews,
    menus: [...menus.values()],
    updatedAt: date,
  };
}
