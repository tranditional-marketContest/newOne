import { isVagueMenuName } from "./organize";
import type { MenuItem, PriceUnit } from "./types";
import {
  formatUnitPrice,
  inferUnitFromName,
  isPer100gName,
  menuBaseName,
  menuIdentityKey,
  normalizeMenuName,
  unitLabel,
} from "./units";

export {
  formatUnitPrice,
  inferUnitFromName,
  menuBaseName,
  menuIdentityKey,
  normalizeMenuName,
  unitLabel,
};

export function isPer100g(name: string): boolean {
  return isPer100gName(name);
}

export function withMenuUnit(menu: Pick<MenuItem, "name"> & { unit?: PriceUnit }): PriceUnit {
  return menu.unit ?? inferUnitFromName(menu.name);
}

export function boardMenus(menus: MenuItem[]): MenuItem[] {
  const concrete = menus
    .filter((menu) => !isVagueMenuName(menu.name))
    .map((menu) => ({
      ...menu,
      name: normalizeMenuName(menu.name) || menu.name.trim(),
      unit: withMenuUnit(menu),
    }));

  const pricedBy100g = new Set(
    concrete.filter((menu) => menu.unit === "per_100g").map((menu) => normalizeMenuName(menu.name)),
  );

  return concrete.filter((menu) => {
    if (menu.unit === "per_100g") return true;
    if (menu.unit !== "each") return true;
    return !pricedBy100g.has(normalizeMenuName(menu.name));
  });
}
