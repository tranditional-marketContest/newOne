"use client";

import { useMatchingStore } from "@/lib/matching/store";

export function LoginCallout({
  title = "로그인하면 글을 올리고 채팅할 수 있어요",
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  const { viewer, authLoading, authBusy, authError, loginWithGoogle } = useMatchingStore();
  if (authLoading || viewer) return null;

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-hanji-soft bg-hanji-warm/80 px-4 py-3"
          : "rounded-[1.4rem] border border-hanji-soft bg-hanji-warm/80 px-4 py-5 text-center"
      }
    >
      <p className={compact ? "text-sm font-semibold text-ink" : "font-[family-name:var(--font-display)] text-lg font-bold text-ink"}>
        {title}
      </p>
      <button
        type="button"
        disabled={authBusy}
        onClick={() => void loginWithGoogle()}
        className="mt-3 rounded-full bg-hanok-main px-4 py-2 text-sm font-bold text-hanji-main disabled:opacity-60"
      >
        {authBusy ? "로그인 중…" : "Google로 로그인"}
      </button>
      {authError ? <p className="mt-2 text-xs text-danger">{authError}</p> : null}
    </div>
  );
}
