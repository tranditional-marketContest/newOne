"use client";

import { ScreenTitle } from "@/components/screen-title";
import { useMatchingStore } from "@/lib/matching/store";

interface MatchingHeaderProps {
  title?: string;
  backHref?: string;
  showBell?: boolean;
  onBellClick?: () => void;
}

export function MatchingHeader({
  title = "반띵 매칭",
  backHref = "/",
  showBell = true,
  onBellClick,
}: MatchingHeaderProps) {
  const { unreadPushCount } = useMatchingStore();

  return (
    <ScreenTitle
      title={title}
      backHref={backHref}
      right={
        showBell ? (
          <button
            type="button"
            aria-label="알림"
            onClick={onBellClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-lg text-hanji-main transition hover:bg-black/15"
          >
            🔔
            {unreadPushCount > 0 ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#f2d3a2] shadow-[0_0_0_2px_rgba(129,85,48,0.35)]" />
            ) : null}
          </button>
        ) : undefined
      }
    />
  );
}
