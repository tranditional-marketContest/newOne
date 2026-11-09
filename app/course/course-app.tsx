"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import {
  buildGeneratedCourse,
  buildQuickCourse,
  quickCourses,
  shops,
  type CourseResult,
} from "@/lib/course";
import { roadPolyline } from "@/lib/block-road";
import { loadMapPins, type MapPin } from "@/lib/map-pins";
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

function clampAxis(offset: number, view: number, size: number) {
  if (size <= view) return (view - size) / 2;
  return Math.min(0, Math.max(view - size, offset));
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

const categoryByName = new Map(shops.map((item) => [item.name, item.category]));
const allPlaces = shops.filter((item) => item.kind === "place");

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
  const [pins, setPins] = useState<MapPin[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const minScale = view.width > 0 ? Math.min(1, view.height / (view.width * MAP_RATIO)) : 1;

  const clampOffset = useCallback(
    (next: { x: number; y: number }, nextScale: number) => ({
      x: clampAxis(next.x, view.width, view.width * nextScale),
      y: clampAxis(next.y, view.height, view.width * MAP_RATIO * nextScale),
    }),
    [view],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      const next = Math.min(MAX_SCALE, Math.max(minScale, scale * factor));
      const ratio = next / scale;
      setScale(next);
      setOffset((off) => clampOffset({ x: cx - (cx - off.x) * ratio, y: cy - (cy - off.y) * ratio }, next));
    },
    [clampOffset, minScale, scale],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setView({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOffset((off) => clampOffset(off, scale));
  }, [clampOffset, scale]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture can fail outside a real pointer gesture; dragging still works while the pointer stays on the map.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(
      clampOffset(
        { x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY },
        scale,
      ),
    );
  }

  function zoomBy(factor: number) {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  useEffect(() => {
    let live = true;
    loadMapPins().then((rows) => {
      if (live) setPins(rows);
    });
    return () => {
      live = false;
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
      setCourse(buildGeneratedCourse(data.title ?? "", data.entranceId ?? "n1", data.shopIds ?? []));
      setPhase("result");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "코스를 만들지 못했습니다.");
    }
  }

  const showAllDots = phase !== "result";
  const route = course && phase === "result" ? course.shops : [];
  const routeLine = route.length > 1 ? verticalLine(roadPolyline(route)) : "";
  const shopPins: MapPin[] =
    pins.length > 0
      ? pins
      : shops
          .filter((item) => item.kind !== "place")
          .map((item) => ({ id: item.id, name: item.name, x: item.x, y: item.y }));
  const resultPins =
    course?.shops
      .filter((item) => item.kind !== "place")
      .map((item) => shopPins.find((pin) => pin.name === item.name) ?? { id: item.id, name: item.name, x: item.x, y: item.y }) ??
    [];
  const greenPins = showAllDots ? allPlaces : (course?.shops.filter((item) => item.kind === "place") ?? []);

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f7f6f3] text-[#1c1915]">
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <div
          ref={viewportRef}
          className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
          role="application"
          aria-label="지도"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
        <div
          className="absolute top-0 left-0 w-full origin-top-left will-change-transform"
          style={{
            aspectRatio: `1 / ${MAP_RATIO}`,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
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
              style={{ ...point(item), scale: 1 / scale }}
            >
              <CategoryIcon category="수변" className="size-4" />
            </span>
          ))}
          {(showAllDots ? shopPins : resultPins).map((item) => (
            <span
              key={item.id}
              title={item.name}
              className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e23a2b] text-white shadow-[0_0_0_3px_rgba(226,58,43,0.22)]"
              style={{ ...point(item), scale: 1 / scale }}
            >
              <CategoryIcon category={categoryByName.get(item.name) ?? ""} className="size-4" />
            </span>
          ))}
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

        {phase === "home" ? (
          <Link
            href="/"
            aria-label="메인으로"
            className="absolute top-3 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow"
          >
            ←
          </Link>
        ) : (
          <button
            type="button"
            onClick={goHome}
            aria-label="뒤로"
            className="absolute top-3 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow"
          >
            ←
          </button>
        )}
      </div>

      <aside className="flex max-h-[40%] min-h-0 w-full shrink-0 flex-col overflow-y-auto">
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
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {phase === "ask" ? (
        <section className="flex min-h-full flex-col gap-3 px-4 py-4">
          <p className="w-fit rounded-full bg-[#f6e27a] px-3 py-1 text-base font-bold">AI 맞춤 코스</p>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
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
          {quickCourses.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCourse(buildQuickCourse(item.id));
                setPhase("result");
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
