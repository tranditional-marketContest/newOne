import { organizeLocally } from "@/lib/organize";
import { WIKI_CATEGORIES, type WikiCategory } from "@/lib/types";

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

const promptFor = (storeName: string, category: string, reviews: string[]) => `너는 신원시장 신원위키의 정리 담당이다.
아래 소비자 후기들을 읽고, 이 가게의 성격을 2문장 이내로 요약한다.

가게 이름: ${storeName}
카테고리: ${category}

규칙:
- 후기에 없는 내용을 지어내지 않는다.
- 가격·메뉴 나열보다 분위기, 품질, 서비스, 특징을 짧게 적는다.
- 후기에 "고기"처럼 모호한 표현만 있어도 성격을 요약해도 된다. 다만 삼겹살·목살 등 구체 메뉴로 바꿔 쓰지 않는다.
- JSON 객체만 반환한다. 키는 character 하나다.

후기:
${reviews.map((text, index) => `${index + 1}. ${text}`).join("\n")}`;

function readModelText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const content = (candidates[0] as { content?: { parts?: unknown[] } }).content;
  const parts = content?.parts ?? [];
  const texts = parts
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const row = part as { text?: unknown; thought?: unknown };
      if (row.thought === true || typeof row.text !== "string") return "";
      return row.text;
    })
    .filter(Boolean);
  return texts.join("\n").trim();
}

function characterFrom(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const text = (value as { character?: unknown }).character;
  return typeof text === "string" ? text.trim().slice(0, 180) : "";
}

export async function POST(request: Request) {
  let body: { reviews?: unknown; storeName?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식을 읽을 수 없습니다." }, { status: 400 });
  }

  const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
  const category = WIKI_CATEGORIES.find((item) => item === body.category) ?? "식료품";
  const reviews = Array.isArray(body.reviews)
    ? body.reviews
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
        .slice(0, 20)
    : [];

  if (!storeName || reviews.length === 0) {
    return Response.json({ error: "정리할 후기를 확인해 주세요." }, { status: 400 });
  }

  const joined = reviews.join("\n");
  if (joined.length > 6000) {
    return Response.json({ error: "후기가 너무 깁니다." }, { status: 400 });
  }

  const fallback = organizeLocally(joined, category as WikiCategory).character;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({
      source: "local",
      character: fallback,
      notice: "Gemini API 키가 없어 후기 문장으로 성격을 맞춰 넣었습니다.",
    });
  }

  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: promptFor(storeName, category, reviews) }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
          signal: AbortSignal.timeout(12000),
        },
      );
      if (!response.ok) continue;

      const payload: unknown = await response.json();
      const raw = readModelText(payload).replace(/^```json\s*|```$/g, "").trim();
      const character = characterFrom(JSON.parse(raw));
      if (!character) continue;
      return Response.json({ source: "gemini", character, notice: "" });
    } catch {
      continue;
    }
  }

  return Response.json({
    source: "local",
    character: fallback,
    notice: "Gemini 응답을 받지 못해 후기에서 성격을 골랐습니다.",
  });
}
