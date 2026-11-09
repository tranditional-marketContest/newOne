"use client";

import Link from "next/link";
import { MatchingHeader } from "@/components/matching/MatchingHeader";
import {
  formatPrice,
  getRemainingLabel,
  placeLabel,
  pricePerPerson,
  useMatchingStore,
} from "@/lib/matching/store";
import { CURRENT_USER } from "@/lib/matching/types";

export function PostDetailClient({ id }: { id: string }) {
  const { ready, now, getPost } = useMatchingStore();
  const post = getPost(id);

  if (!ready) {
    return (
      <main className="min-h-dvh">
        <MatchingHeader backHref="/matching" title="게시글" showBell={false} />
        <p className="p-6 text-hanok-bright">불러오는 중…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-dvh">
        <MatchingHeader backHref="/matching" title="게시글" showBell={false} />
        <div className="p-6">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
            글을 찾을 수 없어요
          </p>
          <Link href="/matching" className="mt-4 inline-block text-hanok-main underline">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const perPerson = pricePerPerson(post.totalPrice, post.peopleNeeded);
  const seatsLeft = Math.max(post.peopleNeeded - post.peopleJoined, 0);
  const isAuthor = post.authorId === CURRENT_USER.id;
  const canStartChat =
    !isAuthor && (post.status === "open" || post.status === "matched");

  return (
    <main
      className={`relative flex min-h-dvh flex-col ${canStartChat || isAuthor ? "pb-28" : "pb-10"}`}
    >
      <MatchingHeader backHref="/matching" title="게시글" showBell={false} />

      <section className="fade-up px-4 pt-5">
        <div className="overflow-hidden rounded-[1.6rem] border border-hanji-soft bg-hanji-main">
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-hanji-soft via-hanok-light/40 to-hanok-bright/30">
            <span className="text-7xl">{post.imageEmoji}</span>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-hanok-main px-3 py-1 text-xs font-medium text-hanji-main">
                {post.status === "open"
                  ? "모집중"
                  : post.status === "matched"
                    ? "매칭완료·진행중"
                    : post.status === "completed"
                      ? "거래완료"
                      : "마감"}
              </span>
              <span className="text-xs text-hanok-bright">
                {getRemainingLabel(post, now)}
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-[1.7rem] font-bold leading-snug text-ink">
              {post.itemName} {post.peopleNeeded}명이서 나눠요
            </h1>

            <div className="rounded-2xl bg-hanji-warm px-4 py-3">
              <p className="text-2xl font-bold text-hanok-deep">{formatPrice(perPerson)}</p>
              <p className="text-sm text-hanok-bright">
                1인 부담 · 총 {formatPrice(post.totalPrice)}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-hanji-soft pb-3">
                <dt className="text-hanok-bright">가게</dt>
                <dd className="font-medium text-ink">{post.storeName}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-hanji-soft pb-3">
                <dt className="text-hanok-bright">메뉴</dt>
                <dd className="font-medium text-ink">{post.menuName}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-hanji-soft pb-3">
                <dt className="text-hanok-bright">만남 장소</dt>
                <dd className="font-medium text-ink">
                  {placeLabel(post.meetingPlace, post.customPlace)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-hanji-soft pb-3">
                <dt className="text-hanok-bright">인원</dt>
                <dd className="font-medium text-ink">
                  {post.peopleJoined}/{post.peopleNeeded}명 · {seatsLeft}자리 남음
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-hanok-bright">작성자</dt>
                <dd className="font-medium text-ink">{post.authorName}</dd>
              </div>
            </dl>

            {post.note ? (
              <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/80 px-4 py-3">
                <p className="text-xs text-hanok-bright">한마디</p>
                <p className="mt-1 text-sm text-ink">{post.note}</p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-hanok-main">
          {isAuthor
            ? "이 글은 게시만 해 두면 됩니다. 다른 이웃이 연락하면 나의 반띵에서 알림을 받고 대화를 이어가세요."
            : "채팅으로 시간과 장소를 맞춘 뒤 매칭을 확정하면, 이 구인 글은 목록에서 내려갑니다."}
        </p>
      </section>

      <div className="app-dock border-t border-hanji-soft bg-hanji-main/95 px-4 pt-4 backdrop-blur">
        {post.status === "completed" ? (
          <div className="rounded-2xl bg-hanok-darkest px-4 py-3 text-center text-hanji-main">
            거래가 완료된 글입니다
          </div>
        ) : isAuthor ? (
          <Link
            href="/matching/mine"
            className="flex items-center justify-center rounded-2xl bg-hanok-dark py-3.5 text-base font-bold text-hanji-main"
          >
            나의 반띵에서 연락 확인
          </Link>
        ) : canStartChat ? (
          <Link
            href={`/matching/${post.id}/chat`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-hanok-main py-3.5 text-base font-bold text-hanji-main shadow-[0_10px_24px_rgba(129,85,48,0.28)]"
          >
            <span className="text-lg">💬</span>
            1대1 채팅하기
          </Link>
        ) : (
          <div className="rounded-2xl bg-hanji-soft px-4 py-3 text-center text-sm text-hanok-deep">
            지금은 채팅할 수 없는 글입니다
          </div>
        )}
      </div>
    </main>
  );
}
