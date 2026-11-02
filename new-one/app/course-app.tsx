"use client";

import { useState, type FormEvent } from "react";
import {
  buildGeneratedCourse,
  buildQuickCourse,
  quickCourses,
  shops,
  type CourseResult,
} from "@/lib/course";

type Phase = "home" | "quick" | "ask" | "result";
type ChatMessage = { role: "user" | "assistant"; text: string };

function point(item: { x: number; y: number }) {
  return { left: `${item.x}%`, top: `${item.y}%` };
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
  const route = course && phase === "result" ? [course.entrance, ...course.shops] : [];

  return (
    <main className="flex h-[min(100dvh,calc(100vw*16/9))] w-[min(100vw,calc(100dvh*9/16))] flex-col overflow-hidden bg-[#f7f6f3] text-[#1c1915]">
      <div className="relative w-full shrink-0" style={{ aspectRatio: "700 / 740" }}>
        <img src="/market-map.png" alt="신림역과 별빛내린천, 신원시장 지도" className="absolute inset-0 h-full w-full" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          {route.length > 1 ? (
            <polyline
              points={route.map((item) => `${item.x},${item.y}`).join(" ")}
              fill="none"
              stroke="#16a34a"
              strokeWidth="1.1"
              strokeDasharray="1.6 1.1"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        {showAllDots
          ? shops.map((item) => (
              <span
                key={item.id}
                title={item.name}
                className="absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B5E3C] ring-2 ring-[#FFEED6]"
                style={point(item)}
              />
            ))
          : null}
        {phase === "result" && course
          ? course.shops.map((item) => (
              <span
                key={item.id}
                title={item.name}
                className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e11d48] ring-2 ring-white"
                style={point(item)}
              />
            ))
          : null}

        {phase !== "home" ? (
          <button
            type="button"
            onClick={goHome}
            aria-label="뒤로"
            className="absolute top-3 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow"
          >
            ←
          </button>
        ) : null}

        {phase === "quick" ? (
          <div className="absolute inset-x-3 bottom-4 z-20 grid grid-cols-2 gap-2">
            {quickCourses.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCourse(buildQuickCourse(item.id));
                  setPhase("result");
                }}
                className="min-h-20 rounded-xl bg-white/95 px-3 py-2 text-lg leading-6 font-bold shadow"
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
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

      {phase === "home" || phase === "quick" ? (
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
      </aside>
    </main>
  );
}
