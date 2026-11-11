import { WIKI_CATEGORIES, type OrganizedWiki, type PriceUnit, type WikiCategory } from "./types";
import { inferUnitFromContext, isPriceUnit, normalizeMenuName } from "./units";

const CATEGORY_HINTS: { pattern: RegExp; category: WikiCategory }[] = [
  { pattern: /순대국|족발|전집|식당|백반|국밥|분식집/, category: "식당" },
  { pattern: /호떡|떡볶이|김밥|튀김|탕수|오뎅|닭강정|강정|인절미|꿀떡|절편|(?<!호)떡/, category: "간식" },
  { pattern: /옷|의류|옷가게|양말|속옷/, category: "의류" },
  { pattern: /생활용품|문구|청소|세제|그릇/, category: "생활용품" },
  {
    pattern: /반찬|명란|김치|장아찌|나물|과일|야채|채소|사과|포도|귤|토마토|축산|삼겹|목살|수산|생선|굴|새우|회|기름|조미료|들기름|식자재|식품/,
    category: "식자재",
  },
];

function parseAmount(raw: string): number | null {
  const compact = raw.replace(/,/g, "").replace(/\s/g, "");
  const manCheon = compact.match(/^(\d+)만(\d+)천원?$/);
  if (manCheon) return Number(manCheon[1]) * 10000 + Number(manCheon[2]) * 1000;
  const manOnly = compact.match(/^(\d+)만원?$/);
  if (manOnly) return Number(manOnly[1]) * 10000;
  const cheon = compact.match(/^(\d+)천원?$/);
  if (cheon) return Number(cheon[1]) * 1000;
  const won = compact.match(/^(\d+)원$/);
  if (won) return Number(won[1]);
  return null;
}

function cleanMenuName(word: string): string {
  return word
    .replace(/(?:으로|에서|부터|까지|은|는|이|가|을|를|와|과|도|에)$/u, "")
    .replace(/\s*100\s*g$/i, "")
    .replace(/(?:한알|개당|팩|봉지)$/u, "")
    .trim();
}

/** 부위·품목이 불명확한 이름은 가격 평균에 넣지 않는다. */
export function isVagueMenuName(name: string): boolean {
  const base = normalizeMenuName(name).replace(/\s+/g, "").toLowerCase();
  if (!base) return true;
  return /^(오늘|어제|정말|진짜|아주|매우|가격|메뉴|고기|육류|고기류|생선|해산물|과일|야채|채소|반찬|떡|간식|음식|먹거리|그것|이거|저거)$/.test(
    base,
  );
}

export function menusFromText(text: string): { name: string; price: number; unit: PriceUnit }[] {
  const pattern =
    /(\d+\s*만\s*\d*\s*천?\s*원|\d+\s*천\s*원|\d{1,3}(?:,\d{3})+\s*원|\d+\s*원)/g;
  const found: { name: string; price: number; unit: PriceUnit }[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(pattern)) {
    const price = parseAmount(match[1]);
    const index = match.index ?? 0;
    if (!price || price < 100 || price > 500000) continue;
    const before = text.slice(Math.max(0, index - 30), index);
    const around = text.slice(Math.max(0, index - 30), Math.min(text.length, index + match[0].length + 12));
    const words = before.match(/[가-힣A-Za-z0-9]{2,}/g) ?? [];
    const rawName = [...words].reverse().find((word) => /[가-힣]/.test(word));
    if (!rawName) continue;
    const name = cleanMenuName(rawName);
    if (name.length < 1 || isVagueMenuName(name)) continue;
    const unit = inferUnitFromContext(around, rawName);
    const key = `${name}-${unit}-${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ name, price, unit });
  }

  return found.slice(0, 8);
}

function sentencesOf(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.trim().split(/(?<=[.?!])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);
}

function hasPrice(sentence: string): boolean {
  return /\d+\s*원|\d+\s*천\s*원|\d+\s*만/.test(sentence);
}

function joinUnique(parts: string[]): string {
  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].join(", ");
}

export function organizeLocally(
  text: string,
  currentCategory: WikiCategory,
): OrganizedWiki {
  const trimmed = text.trim();
  const menus = menusFromText(trimmed);
  const sentences = sentencesOf(trimmed);
  const hoursMatch = trimmed.match(
    /((?:오전|오후|아침|저녁|밤)?\s*\d{1,2}\s*(?:시|:\d{2}))\s*(?:부터|~|-|–|에서)\s*((?:오전|오후|아침|저녁|밤)?\s*\d{1,2}\s*(?:시|:\d{2}))\s*(?:까지)?/,
  );
  const hinted = CATEGORY_HINTS.find((hint) => hint.pattern.test(trimmed));
  const noteParts = sentences.filter((sentence) =>
    /포장|카드|현금|주차|웨이팅|예약|화장실/.test(sentence),
  );
  const discountParts = sentences.filter((sentence) => /할인|덤|서비스|끼워/.test(sentence));
  const descriptive = sentences.filter(
    (sentence) =>
      !hasPrice(sentence) &&
      !/시부터|시까지|영업은|운영은|운영시간/.test(sentence) &&
      !noteParts.includes(sentence) &&
      !discountParts.includes(sentence),
  );
  const characterSource = (descriptive.length > 0 ? descriptive : sentences.filter((sentence) => !hasPrice(sentence)))
    .slice(0, 2)
    .join(" ");

  return {
    category: hinted?.category ?? currentCategory,
    hours: hoursMatch ? `${hoursMatch[1].trim()} ~ ${hoursMatch[2].trim()}` : "",
    items: joinUnique(menus.map((menu) => menu.name)),
    character: characterSource.slice(0, 180),
    discount: discountParts.join(" ").slice(0, 120),
    note: noteParts.join(" ").slice(0, 160),
    menus,
  };
}

export function coerceOrganized(
  value: unknown,
  currentCategory: WikiCategory,
): OrganizedWiki | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const category = WIKI_CATEGORIES.find((item) => item === record.category) ?? currentCategory;
  const menus = Array.isArray(record.menus)
    ? record.menus
        .map((menu) => {
          if (!menu || typeof menu !== "object") return null;
          const row = menu as Record<string, unknown>;
          const rawName = typeof row.name === "string" ? row.name.trim() : "";
          const name = normalizeMenuName(rawName) || rawName;
          const price = typeof row.price === "number" ? row.price : Number(row.price);
          if (!name || isVagueMenuName(name) || !Number.isFinite(price) || price <= 0) return null;
          const unit = isPriceUnit(row.unit) ? row.unit : inferUnitFromContext(rawName, rawName);
          return { name, price: Math.round(price), unit };
        })
        .filter((menu): menu is { name: string; price: number; unit: PriceUnit } => menu !== null)
        .slice(0, 8)
    : [];

  const text = (key: string, max: number) =>
    typeof record[key] === "string" ? record[key].trim().slice(0, max) : "";

  const items = text("items", 160)
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !isVagueMenuName(part))
    .join(", ");

  return {
    category,
    hours: text("hours", 80),
    items,
    character: text("character", 180),
    discount: text("discount", 120),
    note: text("note", 160),
    menus,
  };
}
