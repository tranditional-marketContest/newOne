"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ScreenTitle } from "@/components/screen-title";
import {
  buildGeneratedCourse,
  buildQuickCourse,
  places,
  quickCourses,
  type CourseResult,
} from "@/lib/course";
import { roadPolyline } from "@/lib/block-road";
import { loadLiveStores } from "@/lib/market-stores";
import { getSupabase } from "@/lib/supabase/client";
import type { Store } from "@/data/market";
import { CategoryIcon } from "./category-icon";

type Phase = "home" | "quick" | "ask" | "result";
type ChatMessage = { role: "user" | "assistant"; text: string };

const CROP_TOP = (58 / 430) * 100;
const CROP_BOTTOM = (291 / 430) * 100;
const MAP_RATIO = 1024 / 233;
const MAX_SCALE = 4;

function toVertical(item: { x: number; y: number }) {
  return { x: ((CROP_BOTTOM - item.y) / (CROP_BOTTOM - CROP_TOP)) * 100, y: item.x };
}

function point(item: { x: number; y: number }) {
  const turned = toVertical(item);
  return {
    left: `clamp(14px, ${turned.x}%, calc(100% - 14px))`,
    top: `clamp(14px, ${turned.y}%, calc(100% - 14px))`,
  };
}

function verticalLine(line: string) {
  return line
    .split(" ")
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      const turned = toVertical({ x, y });
      return `${Math.round(turned.x * 100) / 100},${Math.round(turned.y * 100) / 100}`;
    })
    .join(" ");
}

async function postChat(mode: "chat" | "generate", messages: ChatMessage[]) {
  const response = await fetch("/api/course-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, messages }),
    signal: AbortSignal.timeout(70000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "요청에 실패했습니다.");
  }
  return data as { reply?: string; title?: string; entranceId?: string; shopIds?: string[] };
}

export function CourseApp() {
  const [phase, setPhase] = useState<Phase>("home");
  const [course, setCourse] = useState<CourseResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [chatError, setChatError] = useState("");
  const [liveStores, setLiveStores] = useState<Store[]>([]);
  const [storesReady, setStoresReady] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const zoomFocusRef = useRef<{ x: number; y: number } | null>(null);
  const chatPanelRef = useRef<HTMLElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  const minScale = view.width > 0 ? Math.min(1, view.height / (view.width * MAP_RATIO)) : 1;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setView({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [phase]);

  function zoomBy(factor: number) {
    const el = viewportRef.current;
    const map = mapRef.current;
    if (!el || !map || map.offsetWidth === 0 || map.offsetHeight === 0) return;
    const next = Math.min(MAX_SCALE, Math.max(minScale, scale * factor));
    if (next === scale) return;
    zoomFocusRef.current = {
      x: (el.scrollLeft + el.clientWidth / 2 - map.offsetLeft) / map.offsetWidth,
      y: (el.scrollTop + el.clientHeight / 2 - map.offsetTop) / map.offsetHeight,
    };
    setScale(next);
  }

  useEffect(() => {
    const el = viewportRef.current;
    const map = mapRef.current;
    const focus = zoomFocusRef.current;
    if (!el || !map || !focus) return;
    zoomFocusRef.current = null;
    el.scrollLeft = map.offsetLeft + focus.x * map.offsetWidth - el.clientWidth / 2;
    el.scrollTop = map.offsetTop + focus.y * map.offsetHeight - el.clientHeight / 2;
  }, [scale]);

  useEffect(() => {
    if (phase !== "ask") return;
    const frame = window.requestAnimationFrame(() => {
      const list = chatListRef.current;
      const panel = chatPanelRef.current;
      if (list) list.scrollTop = list.scrollHeight;
      if (panel) panel.scrollTop = panel.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, chatError, phase]);

  useEffect(() => {
    let live = true;
    async function refresh() {
      const rows = await loadLiveStores();
      if (!live) return;
      setLiveStores(rows);
      setStoresReady(true);
    }
    void refresh();
    const supabase = getSupabase();
    const channel = supabase
      ?.channel("course-store-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      live = false;
      if (channel) void supabase?.removeChannel(channel);
    };
  }, []);

  function goHome() {
    setPhase("home");
    setCourse(null);
    setMessages([]);
    setReply("");
    setChatError("");
  }

  async function openCustom() {
    setPhase("ask");
    setCourse(null);
    setMessages([]);
    setReply("");
    setChatError("");
    try {
      const data = await postChat("chat", []);
      setMessages((current) =>
        current.some((message) => message.role === "user")
          ? current
          : [{ role: "assistant", text: data.reply || "오늘은 누구와 시장에 오셨어요?" }],
      );
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    const text = reply.trim();
    if (!text) return;
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setReply("");
    setChatError("");
    try {
      const data = await postChat("chat", next);
      setMessages((current) => [...current, { role: "assistant", text: data.reply || "조금만 더 알려 주세요." }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "답을 받지 못했습니다.");
    }
  }

  async function generateCourse() {
    const pending = reply.trim();
    const next = pending ? [...messages, { role: "user" as const, text: pending }] : messages;
    if (next.length === 0) {
      setChatError("대화를 조금 나눈 뒤 코스를 생성해 주세요.");
      return;
    }
    setMessages(next);
    setReply("");
    setChatError("");
    try {
      const data = await postChat("generate", next);
      setCourse(buildGeneratedCourse(data.title ?? "", data.entranceId ?? "n1", data.shopIds ?? [], liveStores));
      setPhase("result");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "코스를 만들지 못했습니다.");
    }
  }

  const showAllDots = phase !== "result";
  const route = course && phase === "result" ? course.shops : [];
  const routeLine = route.length > 1 ? verticalLine(roadPolyline(route)) : "";
  const shopPins = liveStores.map((store) => ({
    id: store.id,
    name: store.name,
    x: store.x,
    y: store.y,
    category: store.category,
  }));
  const resultPins =
    course?.shops
      .filter((item) => item.kind !== "place")
      .map((item) => ({
        id: item.id,
        name: item.name,
        x: item.x,
        y: item.y,
        category: item.category,
      })) ?? [];
  const greenPins = showAllDots ? places : (course?.shops.filter((item) => item.kind === "place") ?? []);

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f7f6f3] text-[#1c1915]">
      <ScreenTitle title="코스 추천" onBack={phase === "home" ? undefined : goHome} />
      {phase === "ask" ? null : (
      <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        <div className="relative min-w-0 flex-1">
        <div
          ref={viewportRef}
          className="absolute inset-0 overflow-auto"
          role="application"
          aria-label="지도"
        >
        <div className="flex min-h-full min-w-full items-center justify-center">
        <div
          ref={mapRef}
          className="relative shrink-0"
          style={{
            width: view.width > 0 ? view.width * scale : "100%",
            aspectRatio: `1 / ${MAP_RATIO}`,
          }}
        >
          <img
            src="/block-map-vertical.jpg"
            alt="신원시장 지도"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {routeLine ? (
              <polyline
                points={routeLine}
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinejoin="miter"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>
          {greenPins.map((item) => (
            <span
              key={item.id}
              title={item.name}
              className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_0_0_3px_rgba(22,163,74,0.25)]"
              style={point(item)}
            >
              <CategoryIcon category="수변" className="size-4" />
            </span>
          ))}
          {(showAllDots ? shopPins : resultPins).map((item) => (
            <span
              key={item.id}
              title={item.name}
              className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e23a2b] text-white shadow-[0_0_0_3px_rgba(226,58,43,0.22)]"
              style={point(item)}
            >
              <CategoryIcon category={item.category} className="size-4" />
            </span>
          ))}
        </div>
        </div>
        </div>

        <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-2">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl bg-white/95 text-2xl font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
            aria-label="확대"
            onClick={() => zoomBy(1.25)}
          >
            +
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl bg-white/95 text-2xl font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
            aria-label="축소"
            onClick={() => zoomBy(1 / 1.25)}
          >
            −
          </button>
        </div>
        </div>
      </div>
      )}

      <aside
        ref={chatPanelRef}
        className={
          phase === "ask"
            ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            : "flex max-h-[40%] min-h-0 w-full shrink-0 flex-col overflow-y-auto"
        }
      >
      {phase === "result" && course ? (
        <section className="flex flex-col gap-3 px-4 pt-4 pb-8">
          <p className="text-lg font-semibold text-[#57534e]">&lt; {course.modeLabel} &gt;</p>
          <h1 className="text-2xl leading-snug font-bold">{course.title}</h1>
          <ol className="flex flex-col gap-3">
            {course.steps.map((step, index) => (
              <li key={`${step.text}-${index}`} className="flex items-start gap-3 text-lg leading-7">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#2563eb] text-base font-bold text-[#2563eb]">
                  {index + 1}
                </span>
                <span>
                  {step.text}
                  {step.detail ? <span className="mt-0.5 block text-sm leading-5 text-[#57534e]">{step.detail}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {phase === "ask" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
          <p className="w-fit rounded-full bg-[#f6e27a] px-3 py-1 text-base font-bold">AI 맞춤 코스</p>
          <div ref={chatListRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-lg leading-7 ${
                  message.role === "assistant" ? "bg-white" : "self-end bg-[#9a3412] text-white"
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
          {chatError ? <p className="text-base text-[#9a3412]">{chatError}</p> : null}
          <form onSubmit={submitReply} className="flex items-center gap-2 rounded-full border border-[#d6d3d1] bg-white px-4 py-2">
            <input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="여기에 입력하세요."
              className="min-w-0 flex-1 bg-transparent text-lg outline-none"
              aria-label="답변 입력"
            />
            <button type="submit" aria-label="보내기" className="text-xl">
              ➤
            </button>
          </form>
          <button
            type="button"
            onClick={generateCourse}
            className="min-h-14 rounded-full bg-[#9a3412] text-xl font-bold text-white"
          >
            코스 생성
          </button>
        </section>
      ) : null}

      {phase === "home" ? (
        <div className="my-auto grid w-full grid-cols-2 gap-3 px-3 py-4">
          <button
            type="button"
            onClick={() => setPhase("quick")}
            className="flex min-h-20 items-center justify-center rounded-full border-2 border-black bg-white px-4 text-center text-lg leading-6 font-bold"
          >
            빠른 코스 추천
          </button>
          <button
            type="button"
            onClick={openCustom}
            className="flex min-h-20 items-center justify-center rounded-full border-2 border-black bg-white px-4 text-center text-lg leading-6 font-bold"
          >
            AI 맞춤 코스 생성
          </button>
        </div>
      ) : null}

      {phase === "quick" ? (
        <div className="my-auto grid w-full grid-cols-2 gap-3 px-3 py-4">
          {chatError ? <p className="col-span-2 text-base text-[#9a3412]">{chatError}</p> : null}
          {!storesReady ? <p className="col-span-2 text-base text-[#57534e]">가게 정보를 불러오는 중…</p> : null}
          {storesReady && liveStores.length === 0 ? (
            <p className="col-span-2 text-base text-[#57534e]">등록된 가게가 없어 코스를 만들 수 없습니다.</p>
          ) : null}
          {quickCourses.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                try {
                  setCourse(buildQuickCourse(item.id, liveStores));
                  setChatError("");
                  setPhase("result");
                } catch (error) {
                  setChatError(error instanceof Error ? error.message : "코스를 만들지 못했습니다.");
                }
              }}
              className="flex min-h-20 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-lg leading-6 font-bold shadow"
            >
              {item.title}
            </button>
          ))}
        </div>
      ) : null}
      </aside>
    </main>
  );
}
