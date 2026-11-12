import { generateGeminiJson, getGeminiApiKey } from "@/lib/gemini";
import { organizeLocally } from "@/lib/organize";
import { WIKI_CATEGORIES, type WikiCategory } from "@/lib/types";

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
  const category = WIKI_CATEGORIES.find((item) => item === body.category) ?? "기타";
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
  if (!getGeminiApiKey()) {
    return Response.json({
      source: "local",
      character: fallback,
      notice:
        "Gemini API 키가 없어 후기 문장으로 성격을 맞춰 넣었습니다. .env.local에 GEMINI_API_KEY를 넣어 주세요.",
    });
  }

  const raw = await generateGeminiJson(promptFor(storeName, category, reviews));
  if (raw) {
    try {
      const character = characterFrom(JSON.parse(raw));
      if (character) {
        return Response.json({ source: "gemini", character, notice: "" });
      }
    } catch {
      // fall through
    }
  }

  return Response.json({
    source: "local",
    character: fallback,
    notice: "Gemini 응답을 받지 못해 후기에서 성격을 골랐습니다.",
  });
}
