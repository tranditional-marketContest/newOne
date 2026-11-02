import "server-only";
import { cacheLife } from "next/cache";
import { generateText } from "@/lib/gemini";

const PLACE_WORDS = ["별빛내린천", "도림천", "신림"] as const;
const PAGE_SIZE = 1000;
const PAGE_CAP = 25;

export type EventBanner = {
  badge: string;
  title: string;
  subtitle: string;
  meta: string;
  kind?: "fountain";
  imageUrl: string | null;
  sheet: {
    badge: string;
    title: string;
    summary: string;
    rows: { label: string; value: string }[];
    link: string | null;
  };
};

type SeoulEvent = {
  GUNAME?: string;
  TITLE?: string;
  DATE?: string;
  PLACE?: string;
  USE_TRGT?: string;
  USE_FEE?: string;
  PROGRAM?: string;
  ETC_DESC?: string;
  MAIN_IMG?: string;
  STRTDATE?: string;
  END_DATE?: string;
  IS_FREE?: string;
  HMPG_ADDR?: string;
  ORG_LINK?: string;
};

type SeoulPayload = {
  culturalEventInfo?: {
    list_total_count?: number;
    RESULT?: { CODE?: string; MESSAGE?: string };
    row?: SeoulEvent | SeoulEvent[];
  };
  RESULT?: { CODE?: string; MESSAGE?: string };
};

export const pendingEventBanner: EventBanner = {
  badge: "안내",
  title: "별빛내린천",
  subtitle: "오늘 행사를 확인하고 있습니다",
  meta: "",
  imageUrl: null,
  sheet: {
    badge: "안내",
    title: "별빛내린천",
    summary: "서울시 문화행사 정보에서 관악구 행사를 확인하고 있습니다.",
    rows: [],
    link: null,
  },
};

function fountainBanner(): EventBanner {
  return {
    badge: "안내",
    kind: "fountain",
    title: "별빛내린천 음악분수",
    subtitle: "6-10월",
    meta: "12시 · 15시 · 19시 · 20시 · 21시",
    imageUrl: null,
    sheet: {
      badge: "음악분수",
      title: "별빛내린천",
      summary: "별빛내린천 음악분수는 매년 6월부터 10월까지 가동합니다.",
      rows: [
        { label: "기간", value: "매년 6월부터 10월까지" },
        { label: "시간", value: "매일 12시, 15시, 19시, 20시, 21시" },
        { label: "한 회", value: "약 20분" },
      ],
      link: null,
    },
  };
}

function noticeBanner(subtitle: string, summary: string): EventBanner {
  return {
    badge: "안내",
    title: "별빛내린천",
    subtitle,
    meta: "",
    imageUrl: null,
    sheet: {
      badge: "안내",
      title: "별빛내린천",
      summary,
      rows: [],
      link: null,
    },
  };
}

function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function dayOf(value: string | undefined) {
  return (value ?? "").slice(0, 10);
}

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars.slice(0, max).join("")}…`;
}

function rowsOf(row: SeoulEvent | SeoulEvent[] | undefined) {
  if (!row) return [];
  return Array.isArray(row) ? row : [row];
}

function placeRank(place: string) {
  const index = PLACE_WORDS.findIndex((word) => place.includes(word));
  return index === -1 ? PLACE_WORDS.length : index;
}

function matchesPlace(event: SeoulEvent) {
  const guname = (event.GUNAME ?? "").trim();
  const place = event.PLACE ?? "";
  return guname === "관악구" && PLACE_WORDS.some((word) => place.includes(word));
}

function pickEvent(events: SeoulEvent[], today: string) {
  return events
    .filter((event) => {
      const end = dayOf(event.END_DATE) || dayOf(event.STRTDATE);
      return !end || end >= today;
    })
    .sort((a, b) => {
      const place = placeRank(a.PLACE ?? "") - placeRank(b.PLACE ?? "");
      if (place !== 0) return place;
      const aOngoing = dayOf(a.STRTDATE) <= today ? 0 : 1;
      const bOngoing = dayOf(b.STRTDATE) <= today ? 0 : 1;
      if (aOngoing !== bOngoing) return aOngoing - bOngoing;
      const aDate = aOngoing === 0 ? dayOf(a.END_DATE) : dayOf(a.STRTDATE);
      const bDate = bOngoing === 0 ? dayOf(b.END_DATE) : dayOf(b.STRTDATE);
      return aDate.localeCompare(bDate);
    })[0];
}

function badgeOf(event: SeoulEvent, today: string) {
  const start = dayOf(event.STRTDATE);
  if (start && start > today) return "예정";
  return "진행 중";
}

function scheduleOf(event: SeoulEvent) {
  const date = (event.DATE ?? "").trim();
  if (date) return date;
  const start = dayOf(event.STRTDATE);
  const end = dayOf(event.END_DATE);
  if (start && end && start !== end) return `${start}~${end}`;
  return start;
}

function httpsUrl(value: string | undefined) {
  const url = (value ?? "").trim();
  if (!url.startsWith("https://")) return null;
  return url;
}

function sourceText(event: SeoulEvent) {
  return [event.TITLE, event.DATE, event.PLACE, event.USE_TRGT, event.USE_FEE, event.PROGRAM, event.ETC_DESC, event.STRTDATE, event.END_DATE]
    .filter(Boolean)
    .join("\n");
}

function numbersStayGrounded(text: string, source: string) {
  const numbers = text.match(/\d+/g) ?? [];
  return numbers.every((number) => source.includes(number));
}

function parseCopy(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(cleaned.slice(start, end + 1)) as { title?: unknown; subtitle?: unknown };
    return {
      title: typeof value.title === "string" ? value.title : "",
      subtitle: typeof value.subtitle === "string" ? value.subtitle : "",
    };
  } catch {
    return null;
  }
}

async function bannerCopy(event: SeoulEvent) {
  const officialTitle = (event.TITLE ?? "").trim();
  const source = sourceText(event);
  const fallback = {
    title: officialTitle || "별빛내린천",
    subtitle: (event.PLACE ?? "").trim() || "관악구 문화행사",
  };

  try {
    const text = await generateText(
      [
        "다음은 서울시 문화행사 정보의 공식 레코드 한 건이다.",
        "이 내용에 있는 사실만 사용해서 배너 문구를 작성해라.",
        "레코드에 없는 시간, 장소, 요금, 대상, 프로그램은 만들지 마라.",
        "JSON만 출력해라.",
        '{"title":"공식 행사명에서 그대로 가져온 14자 이내 표현","subtitle":"장소나 내용을 담은 24자 이내 한 줄"}',
        "",
        source.slice(0, 1200),
      ].join("\n"),
    );
    const parsed = parseCopy(text);
    if (!parsed) return fallback;
    const title = parsed.title.replace(/\s+/g, " ").trim().replace(/…$/, "");
    const subtitle = clip(parsed.subtitle, 28);
    return {
      title: title && officialTitle.includes(title) ? clip(title, 18) : fallback.title,
      subtitle: subtitle && numbersStayGrounded(subtitle, source) ? subtitle : fallback.subtitle,
    };
  } catch {
    return fallback;
  }
}

async function readPage(key: string, start: number, end: number) {
  const bases = ["http://openapi.seoul.go.kr:8088", "https://openapi.seoul.go.kr:8088"];
  let lastError: unknown;

  for (const base of bases) {
    try {
      const response = await fetch(`${base}/${key}/json/culturalEventInfo/${start}/${end}/`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`서울시 문화행사 응답 ${response.status}`);
      return (await response.json()) as SeoulPayload;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function loadEvents(key: string) {
  const events: SeoulEvent[] = [];
  let total = PAGE_SIZE;

  for (let page = 0; page < PAGE_CAP && events.length < total; page += 1) {
    const start = page * PAGE_SIZE + 1;
    const end = start + PAGE_SIZE - 1;
    const payload = await readPage(key, start, end);
    const block = payload.culturalEventInfo;
    const code = block?.RESULT?.CODE ?? payload.RESULT?.CODE;
    if (code && code !== "INFO-000") {
      throw new Error(block?.RESULT?.MESSAGE ?? payload.RESULT?.MESSAGE ?? "서울시 문화행사 조회에 실패했습니다.");
    }
    total = Number(block?.list_total_count ?? events.length);
    events.push(...rowsOf(block?.row));
    if (!block?.row) break;
  }

  return events;
}

function toBanner(event: SeoulEvent, copy: { title: string; subtitle: string }, today: string): EventBanner {
  const badge = badgeOf(event, today);
  const meta = scheduleOf(event);
  const fee = (event.USE_FEE ?? "").trim() || ((event.IS_FREE ?? "").toUpperCase() === "Y" ? "무료" : "");
  const detail = (event.PROGRAM ?? "").trim() || (event.ETC_DESC ?? "").trim();
  const rows = [
    { label: "기간", value: meta },
    { label: "장소", value: (event.PLACE ?? "").trim() },
    { label: "대상", value: (event.USE_TRGT ?? "").trim() },
    { label: "이용요금", value: fee },
    { label: "내용", value: detail },
  ].filter((row) => row.value);

  return {
    badge,
    title: copy.title,
    subtitle: copy.subtitle,
    meta,
    imageUrl: httpsUrl(event.MAIN_IMG),
    sheet: {
      badge,
      title: (event.TITLE ?? "").trim() || copy.title,
      summary: copy.subtitle,
      rows,
      link: httpsUrl(event.HMPG_ADDR) ?? httpsUrl(event.ORG_LINK),
    },
  };
}

export async function getEventBanner(source: "ready" | "missing"): Promise<EventBanner> {
  "use cache";
  cacheLife("days");

  if (source === "missing") {
    return noticeBanner(
      "행사 정보를 불러오지 못했습니다",
      "서울시 문화행사 정보를 연결하면 관악구의 별빛내린천, 도림천, 신림 행사가 여기에 표시됩니다.",
    );
  }

  const key = process.env.SEOUL_OPEN_API_KEY;
  if (!key) {
    return noticeBanner(
      "행사 정보를 불러오지 못했습니다",
      "서울시 문화행사 정보를 연결하면 관악구의 별빛내린천, 도림천, 신림 행사가 여기에 표시됩니다.",
    );
  }

  try {
    const today = seoulToday();
    const chosen = pickEvent((await loadEvents(key)).filter(matchesPlace), today);
    if (!chosen) {
      return fountainBanner();
    }
    return toBanner(chosen, await bannerCopy(chosen), today);
  } catch {
    return noticeBanner(
      "행사 정보를 불러오지 못했습니다",
      "서울시 문화행사 정보를 지금 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.",
    );
  }
}
