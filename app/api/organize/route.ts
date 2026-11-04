import { generateGeminiJson, getGeminiApiKey } from "@/lib/gemini";
import { coerceOrganized, organizeLocally } from "@/lib/organize";
import { WIKI_CATEGORIES, type WikiCategory } from "@/lib/types";

const promptFor = (storeName: string, category: string, text: string) => `너는 신원시장 신원위키의 정리 담당이다.
소비자가 블로그나 리뷰처럼 자유롭게 쓴 글을, 위키 항목으로만 요약한다.

가게 이름: ${storeName}
현재 카테고리: ${category}

규칙:
- 글에 없는 메뉴, 가격, 운영시간, 할인, 특이사항은 만들지 않는다.
- 가격은 원 단위 정수만 넣는다. 단위가 애매하면 그 메뉴는 빼라.
- 메뉴 이름이 모호하면 menus와 items에 넣지 않는다. 예: 고기, 육류, 생선, 과일, 야채, 채소, 반찬, 떡, 간식, 음식. 삼겹살·목살·방울토마토처럼 구체적일 때만 넣는다. 추측해서 구체 메뉴로 바꾸지 않는다.
- 모호한 표현은 character 요약에만 남겨도 된다.
- category는 반드시 다음 중 하나다. ${WIKI_CATEGORIES.join(", ")}. 글만으로 판단이 어려우면 현재 카테고리를 유지한다.
- character는 가게 성격을 2문장 이내로 요약한 문장이다.
- hours는 "오전 10시 ~ 저녁 8시"처럼 짧게 쓴다. 글에 없으면 빈 문자열이다.
- items는 글에 나온 구체 판매 품목만 쉼표로 잇는다. 모호한 말은 빼라.
- menus는 글에서 가격이 확인되고 이름이 구체적인 메뉴만 넣는다.
- JSON 객체만 반환한다. 키는 category, hours, items, character, discount, note, menus 이다.
- menus 항목은 name, price 만 가진다.

소비자 글:
${text}`;

export async function POST(request: Request) {
  let body: { text?: unknown; storeName?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식을 읽을 수 없습니다." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
  const category = WIKI_CATEGORIES.find((item) => item === body.category) ?? "기타";
  if (text.length < 2 || text.length > 4000 || !storeName) {
    return Response.json({ error: "정리할 글을 확인해 주세요." }, { status: 400 });
  }

  const fallback = organizeLocally(text, category as WikiCategory);
  if (!getGeminiApiKey()) {
    return Response.json({
      source: "local",
      result: fallback,
      notice: "Gemini API 키가 없어 글에서 가격과 문장을 직접 나눠 넣었습니다. .env.local에 GEMINI_API_KEY를 넣어 주세요.",
    });
  }

  const raw = await generateGeminiJson(promptFor(storeName, category, text));
  if (raw) {
    try {
      const organized = coerceOrganized(JSON.parse(raw), category as WikiCategory);
      if (organized) {
        return Response.json({ source: "gemini", result: organized, notice: "" });
      }
    } catch {
      // fall through
    }
  }

  return Response.json({
    source: "local",
    result: fallback,
    notice: "Gemini 응답을 받지 못해 글에서 직접 항목을 골랐습니다.",
  });
}
