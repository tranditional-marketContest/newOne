import { isVagueMenuName } from "./organize";
import type { MenuItem } from "./types";

const PER_100G = /100\s*g$/i;

export function isPer100g(name: string): boolean {
  return PER_100G.test(name.trim());
}

export function menuBaseName(name: string): string {
  return name.replace(/\s*100\s*g$/i, "").trim();
}

export function boardMenus(menus: MenuItem[]): MenuItem[] {
  const concrete = menus.filter((menu) => !isVagueMenuName(menu.name));
  const pricedBy100g = new Set(
    concrete.filter((menu) => isPer100g(menu.name)).map((menu) => menuBaseName(menu.name)),
  );

  return concrete.filter((menu) => {
    if (isPer100g(menu.name)) return true;
    return !pricedBy100g.has(menu.name.trim());
  });
}
