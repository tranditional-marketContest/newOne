"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertSettings } from "@/src/components/matching/AlertSettings";
import { ConfirmDialog } from "@/src/components/matching/ConfirmDialog";
import { CreateWizard } from "@/src/components/matching/CreateWizard";
import { MatchingHeader } from "@/src/components/matching/MatchingHeader";
import { PostCard } from "@/src/components/matching/PostCard";
import {
  formatMatchedAt,
  formatPrice,
  pricePerPerson,
  useMatchingStore,
} from "@/src/lib/matching-store";
import { CURRENT_USER, type MatchingPost } from "@/src/lib/types";

type PendingAction =
  | { type: "delete"; post: MatchingPost }
  | { type: "complete"; post: MatchingPost }
  | null;

export default function MyMatchingPage() {
  const {
    ready,
    myActivePosts,
    myInProgressPosts,
    myOpenPosts,
    chatNotifyCount,
    hasIncomingChat,
    isChatUnread,
    completeTrade,
    deletePost,
  } = useMatchingStore();
  const [alertOpen, setAlertOpen] = useState(false);
  const [editPost, setEditPost] = useState<MatchingPost | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const handleConfirmPending = () => {
    if (!pending) return;
    if (pending.type === "delete") {
      deletePost(pending.post.id);
    } else {
      completeTrade(pending.post.id);
    }
    setPending(null);
  };

  return (
    <main className="relative flex min-h-full flex-col pb-10">
      <MatchingHeader
        title="나의 반띵"
        backHref="/matching"
        onBellClick={() => setAlertOpen(true)}
      />

      <section className="px-4 pt-5">
        <div className="mb-5 rounded-[1.4rem] border border-hanji-soft bg-hanji-warm/80 px-4 py-4">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
            나의 반띵
          </p>
          <p className="mt-1 break-keep text-sm leading-relaxed text-hanok-bright">
            글은 게시만 해 두고,
            <br />
            다른 이웃이 연락하면
            <br />
            여기서 알림을 받아 대화를 이어가세요.
            <br />
            거래까지 끝나면 목록에서 내려갑니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-hanok-deep">
            <span className="rounded-full bg-hanok-darkest px-3 py-1 text-hanji-main">
              진행 중 {myInProgressPosts.length}
            </span>
            <span className="rounded-full bg-hanji-soft px-3 py-1">
              모집 중 {myOpenPosts.length}
            </span>
            {chatNotifyCount > 0 ? (
              <span className="rounded-full bg-danger px-3 py-1 text-hanji-main">
                새 연락 {chatNotifyCount}
              </span>
            ) : null}
          </div>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-hanji-soft bg-hanji-main p-8 text-center text-hanok-bright">
            불러오는 중…
          </div>
        ) : myActivePosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-main p-8 text-center">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-hanok-dark">
              아직 나의 반띵이 없어요
            </p>
            <p className="mt-2 text-sm text-hanok-bright">
              글을 올리거나 매칭을 확정하면 여기에 모입니다.
            </p>
            <Link
              href="/matching"
              className="mt-5 inline-flex rounded-full bg-hanok-main px-4 py-2 text-sm font-bold text-hanji-main"
            >
              반띵 구경하기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {myInProgressPosts.length > 0 ? (
              <section className="space-y-3">
                <h2 className="px-1 font-[family-name:var(--font-display)] text-lg font-bold text-ink">
                  진행 중인 반띵 제안
                </h2>
                {myInProgressPosts.map((post) => {
                  const isAuthor = post.authorId === CURRENT_USER.id;
                  const canChat = !isAuthor || hasIncomingChat(post.id);
                  return (
                    <article
                      key={post.id}
                      className="space-y-2 rounded-[1.5rem] border-2 border-hanok-main bg-[#fff8ea] p-2 shadow-[0_10px_24px_rgba(129,85,48,0.12)]"
                    >
                      <div className="flex items-center justify-between px-2 pt-1 text-xs font-bold text-hanok-dark">
                        <span>{formatMatchedAt(post.matchedAt)} · 매칭 완료</span>
                        <span>
                          1인{" "}
                          {formatPrice(
                            pricePerPerson(post.totalPrice, post.peopleNeeded),
                          )}
                        </span>
                      </div>
                      <PostCard
                        post={post}
                        showRemaining={false}
                        matchedLabel={`${post.peopleNeeded}명 매칭 완료`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
                        <div className="flex flex-wrap gap-2">
                          {isAuthor ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditPost(post)}
                                className="rounded-full bg-hanji-soft px-3 py-1.5 text-xs font-bold text-hanok-dark"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => setPending({ type: "delete", post })}
                                className="rounded-full bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger"
                              >
                                삭제
                              </button>
                            </>
                          ) : null}
                          {canChat ? (
                            <Link
                              href={`/matching/${post.id}/chat`}
                              className="rounded-full px-3 py-1.5 text-xs font-bold text-hanok-deep underline"
                            >
                              대화 이어가기
                            </Link>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPending({ type: "complete", post })}
                          className="rounded-full bg-hanok-dark px-3 py-1.5 text-xs font-bold text-hanji-main"
                        >
                          거래 완료
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}

            {myOpenPosts.length > 0 ? (
              <section className="space-y-3">
                <h2 className="px-1 font-[family-name:var(--font-display)] text-lg font-bold text-ink">
                  내가 올린 · 참여 중인 모집
                </h2>
                {myOpenPosts.map((post) => {
                  const isAuthor = post.authorId === CURRENT_USER.id;
                  const unread = isChatUnread(post.id);
                  const incoming = hasIncomingChat(post.id);
                  return (
                    <article
                      key={post.id}
                      className={`space-y-2 rounded-[1.2rem] p-1 ${
                        unread
                          ? "border-2 border-danger/40 bg-[#fff4ef]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between px-1 text-xs text-hanok-bright">
                        <span className="inline-flex items-center gap-2">
                          {isAuthor ? "내가 올린 글" : "참여 중인 글"}
                          {unread ? (
                            <span className="rounded-full bg-danger px-2 py-0.5 text-[0.65rem] font-bold text-hanji-main">
                              새 연락
                            </span>
                          ) : null}
                        </span>
                        <span>
                          1인{" "}
                          {formatPrice(
                            pricePerPerson(post.totalPrice, post.peopleNeeded),
                          )}
                        </span>
                      </div>
                      <PostCard post={post} />
                      <div className="flex flex-wrap gap-2 px-1">
                        {isAuthor ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditPost(post)}
                              className="rounded-full bg-hanji-soft px-3 py-1.5 text-xs font-bold text-hanok-dark"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => setPending({ type: "delete", post })}
                              className="rounded-full bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger"
                            >
                              삭제
                            </button>
                          </>
                        ) : null}
                        <Link
                          href={`/matching/${post.id}`}
                          className="rounded-full px-3 py-1.5 text-xs font-bold text-hanok-deep underline"
                        >
                          상세 보기
                        </Link>
                        {isAuthor && incoming ? (
                          <Link
                            href={`/matching/${post.id}/chat`}
                            className="rounded-full bg-hanok-main px-3 py-1.5 text-xs font-bold text-hanji-main"
                          >
                            대화 이어가기
                          </Link>
                        ) : null}
                        {!isAuthor ? (
                          <Link
                            href={`/matching/${post.id}/chat`}
                            className="rounded-full px-3 py-1.5 text-xs font-bold text-hanok-deep underline"
                          >
                            채팅하기
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}
          </div>
        )}
      </section>

      <AlertSettings open={alertOpen} onClose={() => setAlertOpen(false)} />
      <CreateWizard
        open={Boolean(editPost)}
        editPost={editPost}
        onClose={() => setEditPost(null)}
      />
      <ConfirmDialog
        open={pending?.type === "delete"}
        title="게시글 삭제"
        message="게시글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        danger
        onCancel={() => setPending(null)}
        onConfirm={handleConfirmPending}
      />
      <ConfirmDialog
        open={pending?.type === "complete"}
        title="거래 완료"
        message="거래를 마쳤나요? 거래 완료하면 나의 반띵 목록에서 사라집니다."
        confirmLabel="거래 완료"
        cancelLabel="취소"
        onCancel={() => setPending(null)}
        onConfirm={handleConfirmPending}
      />
    </main>
  );
}
