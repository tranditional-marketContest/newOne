"use client";

import Link from "next/link";
import { useMatchingStore } from "@/lib/matching-store";

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
  const { alertCount } = useMatchingStore();

  return (
    <header className="wood-bar sticky top-0 z-20 px-4 pb-3 pt-4 shadow-[0_8px_20px_rgba(82,36,14,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          aria-label="뒤로가기"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-xl text-hanji-main transition hover:bg-black/15"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-[1.35rem] font-bold tracking-tight text-hanji-main">
            {title}
          </p>
          <p className="text-[0.7rem] tracking-[0.18em] text-hanji-soft/90">
            신원시장
          </p>
        </div>
        {showBell ? (
          <button
            type="button"
            aria-label="알림 설정"
            onClick={onBellClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-lg text-hanji-main transition hover:bg-black/15"
          >
            🔔
            {alertCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2d3a2] px-1 text-[0.6rem] font-bold text-hanok-darkest">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f2d3a2]/70" />
            )}
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>
    </header>
  );
}
