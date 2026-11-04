import { createClient } from "@supabase/supabase-js";
import { organizeLocally } from "../lib/organize";
import type { WikiCategory } from "../lib/types";
import { WIKI_CATEGORIES } from "../lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const geminiKey = process.env.GEMINI_API_KEY?.trim();

if (!url || !key) {
  console.error("Supabase env가 없습니다.");
  process.exit(1);
}

const supabase = createClient(url, key);

type ReviewRow = {
  id: string;
  store_id: string;
  text: string;
  purchased_items: string | null;
};

type StoreRow = {
  id: string;
  category: WikiCategory;
};

async function organizeWithGemini(
  storeName: string,
  category: WikiCategory,
  text: string,
): Promise<ReturnType<typeof organizeLocally> | null> {
  if (!geminiKey || text.trim().length < 2) return null;
  const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
  const prompt = `너는 신원시장 신원위키의 정리 담당이다.
소비자가 쓴 후기를 위키 항목으로만 요약한다.
가게 이름: ${storeName}
현재 카테고리: ${category}
규칙:
- 글에 없는 내용은 만들지 않는다.
- 메뉴 이름이 모호하면(고기, 과일 등) menus/items에 넣지 않는다.
- JSON만 반환. 키: category, hours, items, character, discount, note, menus
- menus 항목은 name, price
후기:
${text}`;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
          signal: AbortSignal.timeout(12000),
        },
      );
      if (!response.ok) continue;
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const raw = (payload.candidates?.[0]?.content?.parts ?? [])
        .filter((part) => part.thought !== true && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
        .replace(/^```json\s*|```$/g, "")
        .trim();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const categoryValue =
        WIKI_CATEGORIES.find((item) => item === parsed.category) ?? category;
      const menus = Array.isArray(parsed.menus)
        ? parsed.menus
            .map((menu) => {
              if (!menu || typeof menu !== "object") return null;
              const row = menu as { name?: unknown; price?: unknown };
              const name = typeof row.name === "string" ? row.name.trim() : "";
              const price = typeof row.price === "number" ? row.price : Number(row.price);
              if (!name || !Number.isFinite(price) || price <= 0) return null;
              return { name, price: Math.round(price) };
            })
            .filter((menu): menu is { name: string; price: number } => menu !== null)
        : [];
      const textOf = (key: string) =>
        typeof parsed[key] === "string" ? String(parsed[key]).trim() : "";
      return {
        category: categoryValue,
        hours: textOf("hours"),
        items: textOf("items"),
        character: textOf("character"),
        discount: textOf("discount"),
        note: textOf("note"),
        menus,
      };
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  const [{ data: stores, error: storeError }, { data: reviews, error: reviewError }] =
    await Promise.all([
      supabase.from("stores").select("id, name, category"),
      supabase.from("reviews").select("id, store_id, text, purchased_items"),
    ]);

  if (storeError || reviewError || !stores || !reviews) {
    console.error(storeError ?? reviewError);
    process.exit(1);
  }

  const storeMap = new Map(
    (stores as (StoreRow & { name: string })[]).map((store) => [store.id, store]),
  );
  let saved = 0;
  let skipped = 0;

  for (const review of reviews as ReviewRow[]) {
    const store = storeMap.get(review.store_id);
    if (!store) {
      skipped += 1;
      continue;
    }

    const text = (review.text ?? "").trim();
    const purchased = (review.purchased_items ?? "").trim();
    if (!text && !purchased) {
      skipped += 1;
      continue;
    }

    let organized =
      text.length > 1
        ? (await organizeWithGemini(store.name, store.category, text)) ??
          organizeLocally(text, store.category)
        : {
            category: store.category,
            hours: "",
            items: purchased,
            character: "",
            discount: "",
            note: "",
            menus: [] as { name: string; price: number }[],
          };

    if (!organized.character && text) {
      organized = {
        ...organized,
        character: organizeLocally(text, store.category).character,
      };
    }
    if (!organized.items && purchased) {
      organized = { ...organized, items: purchased };
    }

    const { error } = await supabase.from("review_summaries").upsert(
      {
        review_id: review.id,
        category: organized.category,
        hours: organized.hours,
        items: organized.items,
        character: organized.character,
        discount: organized.discount,
        note: organized.note,
        menus: organized.menus,
        source: geminiKey && text ? "gemini-or-local" : "local",
      },
      { onConflict: "review_id" },
    );

    if (error) {
      console.error(review.id, error.message);
      skipped += 1;
      continue;
    }
    saved += 1;
  }

  // 가게별 줄글을 모아 stores.character도 갱신
  for (const store of stores as (StoreRow & { name: string })[]) {
    const prose = (reviews as ReviewRow[])
      .filter((review) => review.store_id === store.id && review.text.trim().length > 1)
      .map((review) => review.text.trim());
    if (prose.length === 0) continue;
    const joined = prose.join("\n");
    const summary =
      (await organizeWithGemini(store.name, store.category, joined)) ??
      organizeLocally(joined, store.category);
    await supabase
      .from("stores")
      .update({ character: summary.character })
      .eq("id", store.id);
  }

  const { count } = await supabase
    .from("review_summaries")
    .select("*", { count: "exact", head: true });

  console.log(
    JSON.stringify(
      {
        saved,
        skipped,
        review_summaries_total: count ?? 0,
        used_gemini: Boolean(geminiKey),
      },
      null,
      2,
    ),
  );
}

void main();
