import { entrances } from "@/lib/course";
import { loadWikiStores, wikiCatalog, wikiIdsToLocalIds } from "@/lib/wiki";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const models = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
].filter((name, index, all): name is string => Boolean(name) && all.indexOf(name) === index);

function forGenerate(messages: ChatMessage[]) {
  const next = [...messages];
  if (next.length === 0 || next[0].role !== "user") {
    next.unshift({ role: "user", text: "신원시장과 별빛내린천을 걷는 코스를 만들어 주세요." });
  }
  if (next[next.length - 1].role !== "user") {
    next.push({
      role: "user",
      text: "방금 질문에는 아직 답이 없다. 이미 들은 내용만으로 코스를 만들고, 비어 있는 조건은 무난한 산책으로 잡아 주세요.",
    });
  }
  return next;
}

function entranceCatalog() {
  return entrances.map((item) => `${item.id} | ${item.name}`).join("\n");
}

function skipModel(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError" || error.name === "AbortError") return true;
  const text = error.message.toLowerCase();
  if (text.includes("billing") || text.includes("api key") || text.includes("permission")) return false;
  return (
    text.includes("high demand") ||
    text.includes("try again") ||
    text.includes("unavailable") ||
    text.includes("no longer available") ||
    text.includes("not found") ||
    text.includes("overloaded") ||
    text.includes("resource_exhausted")
  );
}

async function gemini(system: string, messages: ChatMessage[], json: boolean) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY가 없습니다. .env.local에 넣어 주세요.");
  }

  const contents = (messages.length > 0
    ? messages
    : [{ role: "user" as const, text: "안녕하세요. 신원시장 코스에 필요한 질문을 하나만 해 주세요." }]
  ).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.text }],
  }));

  let last: Error | null = null;
  for (const name of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: json
              ? { temperature: 0.4, responseMimeType: "application/json" }
              : { temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(20000),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || "제미나이 응답을 받지 못했습니다.";
        throw new Error(message);
      }

      const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim();
      if (!text) {
        throw new Error("제미나이가 빈 답을 보냈습니다.");
      }
      console.info(`[course-chat] ${name}`);
      return text;
    } catch (error) {
      last = error instanceof Error ? error : new Error("제미나이 응답을 받지 못했습니다.");
      if (!skipModel(last)) throw last;
      console.info(`[course-chat] skip ${name}: ${last.message}`);
    }
  }

  throw last ?? new Error("제미나이 응답을 받지 못했습니다.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode === "generate" ? "generate" : "chat";
    const messages = Array.isArray(body.messages)
      ? body.messages.filter(
          (message: ChatMessage) =>
            message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.text === "string" &&
            message.text.trim(),
        )
      : [];

    if (mode === "chat") {
      const reply = await gemini(
        [
          "너는 신원시장 코스를 짜는 챗봇이다.",
          "한 번에 질문 하나만 짧게 한다. 말은 쉽고 크게 읽히게 한다.",
          "코스는 신원위키에 적힌 가게 소개, 영업시간, 품목, 할인, 후기를 보고 고른다.",
          "연령대, 동행, 날씨, 분위기, 예산, 걷고 싶은 거리, 먹고 싶은 음식이나 피하고 싶은 음식을 대화로 모은다.",
          "이미 들은 내용은 다시 묻지 않는다.",
          "코스 목록은 만들지 않는다. 코스는 사용자가 코스 생성 버튼을 눌렀을 때 따로 만든다.",
        ].join("\n"),
        messages,
        false,
      );
      return Response.json({ reply });
    }

    const wikiStores = await loadWikiStores();
    const raw = await gemini(
      [
        "대화 내용을 바탕으로 신원시장 도보 코스를 JSON으로만 답한다.",
        "사용자가 마지막 질문에 답을 하지 않았으면, 이미 들은 내용만으로 만든다.",
        "가게는 아래 신원위키 목록에 있는 id만 쓴다. 목록에 없는 가게는 넣지 않는다.",
        "소개, 영업시간, 품목, 할인, 후기가 대화와 맞는 가게를 고른다.",
        "정보가 비어 있으면 카테고리만 보고 고른다. 같은 카테고리는 한 곳만 넣는다.",
        "가게는 3곳 또는 4곳이다.",
        "수변 장소는 모든 코스에 꼭 2곳을 shopIds에 넣는다. 대화 분위기에 맞는 곳을 고른다.",
        "수변: riverside-terrace 수변테라스, acupressure-path 지압보도, kids-sled 어린이 썰매장, media-art 미디어아트&별빛버스킹존, dorim-pool 도림천 물놀이장",
        "출입구는 목록의 id 중 하나다.",
        '형식: {"title":"짧은 코스 이름","entranceId":"n1","shopIds":["id1","id2","id3"]}',
        "신원위키 가게:",
        wikiCatalog(wikiStores),
        "출입구 목록:",
        entranceCatalog(),
      ].join("\n"),
      forGenerate(messages),
      true,
    );

    const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(jsonText) as { title?: string; entranceId?: string; shopIds?: string[] };
    const wikiIds = Array.isArray(parsed.shopIds) ? parsed.shopIds.filter((id) => typeof id === "string") : [];
    return Response.json({
      title: typeof parsed.title === "string" ? parsed.title : "대화로 맞춘 코스",
      entranceId: typeof parsed.entranceId === "string" ? parsed.entranceId : "n1",
      shopIds: wikiIdsToLocalIds(wikiIds, wikiStores),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    const message = timedOut
      ? "제미나이 응답이 너무 늦습니다. 다시 보내 주세요."
      : error instanceof Error
        ? error.message
        : "코스 대화를 처리하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
