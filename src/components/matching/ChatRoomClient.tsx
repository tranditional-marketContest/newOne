"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/matching/ConfirmDialog";
import { MatchingHeader } from "@/components/matching/MatchingHeader";
import {
  formatPrice,
  pricePerPerson,
  useMatchingStore,
} from "@/lib/matching-store";
import { CURRENT_USER } from "@/lib/types";

export function ChatRoomClient({ id }: { id: string }) {
  const router = useRouter();
  const {
    ready,
    getPost,
    getMessages,
    hasIncomingChat,
    markChatRead,
    sendMessage,
    confirmMatch,
    completeTrade,
    joinSeat,
  } = useMatchingStore();
  const [text, setText] = useState("");
  const [matchedFlash, setMatchedFlash] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const post = getPost(id);
  const messages = getMessages(id);
  const isAuthor = post?.authorId === CURRENT_USER.id;
  const incoming = post ? hasIncomingChat(post.id) : false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!post || !isAuthor || !incoming) return;
    markChatRead(post.id);
  }, [post?.id, isAuthor, incoming, markChatRead]);

  const canConfirm = useMemo(() => {
    if (!post || post.status !== "open") return false;
    return messages.some(
      (message) =>
        message.senderId !== CURRENT_USER.id && message.senderId !== "system",
    );
  }, [messages, post]);

  if (!ready) {
    return (
      <main className="min-h-dvh">
        <MatchingHeader backHref="/matching" title="1대1 채팅" showBell={false} />
        <p className="p-6 text-hanok-bright">채팅방을 여는 중…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-dvh">
        <MatchingHeader backHref="/matching" title="1대1 채팅" showBell={false} />
        <div className="p-6">
          <p className="font-bold text-ink">채팅할 글을 찾을 수 없어요</p>
          <Link href="/matching" className="mt-3 inline-block text-hanok-main underline">
            목록으로
          </Link>
        </div>
      </main>
    );
  }

  // Author cannot start a chat alone — only reply after someone contacted them.
  if (isAuthor && !incoming && post.status === "open") {
    return (
      <main className="min-h-dvh">
        <MatchingHeader
          backHref="/matching/mine"
          title="1대1 채팅"
          showBell={false}
        />
        <div className="px-5 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
            아직 연락이 없어요
          </p>
          <p className="mt-2 text-sm leading-relaxed text-hanok-bright">
            게시글은 올려 두기만 하면 됩니다. 다른 이웃이 말을 걸면
            나의 반띵에 알림이 뜨고, 그때 대화를 이어갈 수 있어요.
          </p>
          <Link
            href="/matching/mine"
            className="mt-6 inline-flex rounded-full bg-hanok-main px-4 py-2 text-sm font-bold text-hanji-main"
          >
            나의 반띵으로
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(post.id, text);
    setText("");
  };

  const handleConfirm = () => {
    joinSeat(post.id);
    confirmMatch(post.id);
    setMatchedFlash(true);
    window.setTimeout(() => {
      router.push("/matching/mine");
    }, 1400);
  };

  const counterpart = isAuthor
    ? messages.find(
        (message) =>
          message.senderId !== CURRENT_USER.id && message.senderId !== "system",
      )?.senderName ?? "반띵 이웃"
    : post.authorName;

  return (
    <main className="relative flex min-h-dvh flex-col">
      <MatchingHeader
        backHref={isAuthor ? "/matching/mine" : `/matching/${post.id}`}
        title="1대1 채팅"
        showBell={false}
      />

      <div className="border-b border-hanji-soft bg-hanji-warm/90 px-4 py-3">
        <p className="truncate font-[family-name:var(--font-display)] font-bold text-ink">
          {post.itemName}
        </p>
        <p className="mt-0.5 text-xs text-hanok-main">
          {counterpart} · 1인{" "}
          {formatPrice(pricePerPerson(post.totalPrice, post.peopleNeeded))} ·{" "}
          {post.peopleNeeded}명 모집
        </p>
      </div>

      <section className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/70 px-4 py-3 text-center text-xs text-hanok-deep">
          시간·장소를 맞춘 뒤 매칭을 확정하면 구인 글이 목록에서 내려갑니다.
        </div>

        {messages.length === 0 ? (
          <div className="fade-up rounded-2xl bg-hanji-main px-4 py-6 text-center text-sm text-hanok-bright">
            첫 메시지를 보내 반띵을 시작해 보세요.
          </div>
        ) : null}

        {messages.map((message) => {
          const mine = message.senderId === CURRENT_USER.id;
          const system = message.senderId === "system";

          if (system) {
            return (
              <div
                key={message.id}
                className="fade-up mx-auto max-w-[85%] rounded-full bg-hanok-darkest px-4 py-2 text-center text-xs text-hanji-main"
              >
                {message.text}
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`fade-up flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-[1.2rem] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  mine
                    ? "rounded-br-md bg-hanok-main text-hanji-main"
                    : "rounded-bl-md border border-hanji-soft bg-hanji-main text-ink"
                }`}
              >
                {!mine ? (
                  <p className="mb-1 text-[0.7rem] font-medium text-hanok-bright">
                    {message.senderName}
                  </p>
                ) : null}
                {message.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </section>

      {matchedFlash ? (
        <div className="fade-up absolute inset-x-4 top-1/3 z-30 rounded-[1.4rem] bg-hanok-darkest px-5 py-6 text-center text-hanji-main shadow-2xl">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
            매칭 완료!
          </p>
          <p className="mt-2 text-sm text-hanji-soft">약속 장소에서 만나요</p>
        </div>
      ) : null}

      <div className="sticky bottom-0 border-t border-hanji-soft bg-hanji-main/95 p-3 backdrop-blur">
        {post.status === "open" ? (
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="mb-3 w-full rounded-2xl bg-hanok-dark py-3 text-sm font-bold text-hanji-main enabled:hover:bg-hanok-darkest disabled:cursor-not-allowed disabled:bg-hanji-fiber disabled:text-hanok-bright"
          >
            매칭 확정하기
          </button>
        ) : post.status === "matched" ? (
          <button
            type="button"
            onClick={() => setCompleteOpen(true)}
            className="mb-3 w-full rounded-2xl bg-hanok-dark py-3 text-sm font-bold text-hanji-main"
          >
            거래 완료하기
          </button>
        ) : (
          <div className="mb-3 rounded-2xl bg-hanji-soft py-3 text-center text-sm font-medium text-hanok-deep">
            거래가 완료된 대화입니다
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={post.status === "completed"}
            className="flex-1 rounded-2xl border border-hanji-fiber bg-hanji-warm px-4 py-3 outline-none ring-hanok-main focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={post.status === "completed" || !text.trim()}
            className="rounded-2xl bg-hanok-main px-4 py-3 font-bold text-hanji-main disabled:bg-hanji-fiber disabled:text-hanok-bright"
          >
            전송
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={completeOpen}
        title="거래 완료"
        message="거래를 마쳤나요? 거래 완료하면 나의 반띵 목록에서 사라집니다."
        confirmLabel="거래 완료"
        cancelLabel="취소"
        onCancel={() => setCompleteOpen(false)}
        onConfirm={() => {
          completeTrade(post.id);
          setCompleteOpen(false);
          router.push("/matching/mine");
        }}
      />
    </main>
  );
}
