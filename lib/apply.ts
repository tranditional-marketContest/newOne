import { withMenuUnit } from "./menu-board";
import { isVagueMenuName } from "./organize";
import { seoulToday } from "./price";
import type {
  EditorDraft,
  MenuItem,
  OrganizedWiki,
  PriceSource,
  PriceUnit,
  Review,
  Store,
} from "./types";
import { menuIdentityKey, normalizeMenuName } from "./units";

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

function resolveUnit(row: { unit?: PriceUnit }, fallbackName: string): PriceUnit {
  if (row.unit) return row.unit;
  return withMenuUnit({ name: fallbackName });
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
    const name = normalizeMenuName(menu.name) || menu.name.trim();
    const unit = withMenuUnit(menu);
    const key = menuIdentityKey(name, unit);
    menus.set(key, { ...menu, name, unit, prices: [...menu.prices] });
  }

  for (const row of draft.menus) {
    if (!row.name.trim() || isVagueMenuName(row.name)) continue;
    const name = normalizeMenuName(row.name) || row.name.trim();
    const unit = resolveUnit(row, row.name);
    const key = menuIdentityKey(name, unit);
    const current =
      menus.get(key) ??
      store.menus.find(
        (menu) =>
          menu.id === row.key ||
          menuIdentityKey(normalizeMenuName(menu.name) || menu.name, withMenuUnit(menu)) === key,
      );
    const next: MenuItem = current
      ? { ...current, name, unit, prices: [...current.prices] }
      : { id: row.key, name, unit, prices: [] };
    if (current) {
      const oldKey = menuIdentityKey(
        normalizeMenuName(current.name) || current.name,
        withMenuUnit(current),
      );
      if (oldKey !== key) menus.delete(oldKey);
    }
    const total = money(row.price);
    if (total) {
      // 직접입력 가격은 선택한 단위 단가 그대로 저장
      pushPrice(next, total, date, organized ? undefined : "fields");
    }
    menus.set(key, next);
  }

  if (organized) {
    for (const row of organized.menus) {
      if (!row.name.trim() || isVagueMenuName(row.name) || row.price <= 0) continue;
      const name = normalizeMenuName(row.name) || row.name.trim();
      const unit = row.unit ?? withMenuUnit({ name: row.name });
      const key = menuIdentityKey(name, unit);
      const current = menus.get(key);
      const next: MenuItem = current
        ? { ...current, name, unit, prices: [...current.prices] }
        : { id: crypto.randomUUID(), name, unit, prices: [] };
      pushPrice(next, row.price, date, "prose");
      menus.set(key, next);
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
