"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertSettings } from "@/components/matching/AlertSettings";
import { CategoryBar } from "@/components/matching/CategoryBar";
import { CreateWizard } from "@/components/matching/CreateWizard";
import { MatchingHeader } from "@/components/matching/MatchingHeader";
import { LoginCallout } from "@/components/matching/LoginCallout";
import { PostCard } from "@/components/matching/PostCard";
import { CATEGORIES } from "@/lib/matching/categories";
import { useMatchingStore } from "@/lib/matching/store";
import type { CategoryId } from "@/lib/matching/types";

export default function MatchingListPage() {
  const { ready, openPosts, myActivePosts, chatNotifyCount, loadError } = useMatchingStore();
  const [category, setCategory] = useState<CategoryId>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const filtered = useMemo(
    () =>
      category === "all"
        ? openPosts
        : openPosts.filter((post) => post.category === category),
    [category, openPosts],
  );

  const counts = useMemo(() => {
    const result: Partial<Record<CategoryId, number>> = {
      all: openPosts.length,
    };
    for (const item of CATEGORIES) {
      if (item.id === "all") continue;
      result[item.id] = openPosts.filter((post) => post.category === item.id).length;
    }
    return result;
  }, [openPosts]);

  return (
    <main className="relative flex min-h-full w-full min-w-0 max-w-full shrink-0 flex-col overflow-x-hidden pb-28 [&>*:not(.app-fab)]:shrink-0">
      <MatchingHeader backHref="/" onBellClick={() => setAlertOpen(true)} />
      <CategoryBar value={category} onChange={setCategory} counts={counts} />

      <section className="px-4 pt-5">
        <div className="mb-4 empty:mb-0">
          <LoginCallout compact title="로그인하면 글을 올리고 다른 사용자와 채팅할 수 있어요" />
        </div>
        {loadError ? (
          <p className="mb-4 rounded-2xl bg-[#fff4ef] px-4 py-3 text-sm text-danger">{loadError}</p>
        ) : null}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 font-[family-name:var(--font-display)] text-[1.35rem] font-bold leading-tight text-ink">
              지금 반띵 구해요
            </h2>
            <Link
              href="/matching/mine"
              className="relative shrink-0 rounded-full border border-hanok-light bg-hanji-main px-2.5 py-1.5 text-[0.7rem] font-semibold whitespace-nowrap text-hanok-deep transition hover:bg-hanok-light/30"
            >
              나의 반띵
              {myActivePosts.length > 0 ? ` · ${myActivePosts.length}` : ""}
              {chatNotifyCount > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.6rem] text-hanji-main">
                  {chatNotifyCount}
                </span>
              ) : null}
            </Link>
          </div>
          <p className="text-[0.8125rem] leading-snug text-hanok-bright">
            혼자 사기 부담스러운 상품, 이웃과 나눠요
          </p>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-hanji-soft bg-hanji-warm/80 p-8 text-center text-hanok-bright">
            장부를 펼치는 중…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/70 p-8 text-center">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-hanok-dark">
              아직 열린 반띵이 없어요
            </p>
            <p className="mt-2 text-sm text-hanok-bright">
              오른쪽 아래 버튼으로 첫 구인 글을 올려 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="app-fab fab-pulse flex h-[4.6rem] w-[4.6rem] flex-col items-center justify-center rounded-full bg-hanok-main text-hanji-main shadow-[0_12px_28px_rgba(155,35,53,0.35)]"
      >
        <span className="font-[family-name:var(--font-display)] text-[0.95rem] font-bold leading-none">
          반<span className="mx-[1px] inline-block h-3 w-[2px] bg-hanji-main align-middle" />띵
        </span>
        <span className="mt-1 text-[0.62rem] font-medium">제안하기</span>
      </button>

      <CreateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <AlertSettings open={alertOpen} onClose={() => setAlertOpen(false)} />
    </main>
  );
}
