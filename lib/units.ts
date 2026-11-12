import { PRICE_UNITS, type PriceUnit } from "./types";

const PER_100G = /100\s*g$/i;

export function isPriceUnit(value: unknown): value is PriceUnit {
  return typeof value === "string" && (PRICE_UNITS as readonly string[]).includes(value);
}

export function isPer100gName(name: string): boolean {
  return PER_100G.test(name.trim());
}

export function menuBaseName(name: string): string {
  return name.replace(/\s*100\s*g$/i, "").trim();
}

export function normalizeMenuName(name: string): string {
  return menuBaseName(name.trim());
}

export function inferUnitFromName(name: string): PriceUnit {
  const trimmed = name.trim();
  if (PER_100G.test(trimmed) || /\d+\s*g/i.test(trimmed)) return "per_100g";
  if (/한\s*알|개당|\/\s*개|\d+\s*개|쪽/.test(trimmed)) return "per_piece";
  if (/팩|봉지|망/.test(trimmed)) return "per_pack";
  return "each";
}

export function inferUnitFromContext(snippet: string, menuName: string): PriceUnit {
  const haystack = `${snippet} ${menuName}`;
  if (/100\s*g|\d+\s*g(?:당|에|에\s*약)?/i.test(haystack)) return "per_100g";
  if (/한\s*알|알당|개당|\/\s*개|\d+\s*개|쪽/.test(haystack)) return "per_piece";
  if (/팩|봉지|망/.test(haystack)) return "per_pack";
  if (isPer100gName(menuName)) return "per_100g";
  return "each";
}

export function unitLabel(unit: PriceUnit): string {
  switch (unit) {
    case "per_100g":
      return "100g당";
    case "per_piece":
      return "개당";
    case "per_pack":
      return "팩당";
    case "each":
      return "";
  }
}

export function formatUnitPrice(amount: number, unit: PriceUnit, formatWon: (n: number) => string): string {
  const label = unitLabel(unit);
  const won = formatWon(amount);
  return label ? `${label} ${won}` : won;
}

export function menuIdentityKey(name: string, unit: PriceUnit): string {
  return `${normalizeMenuName(name)}::${unit}`;
}
