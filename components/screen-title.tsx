import Link from "next/link";
import type { ReactNode } from "react";

const backClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-xl text-hanji-main transition hover:bg-black/15";

export function ScreenTitle({
  title,
  backHref = "/",
  onBack,
  leading,
  mark,
  right,
  subtitle = "신원시장",
  large = false,
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
  leading?: ReactNode;
  mark?: ReactNode;
  right?: ReactNode;
  subtitle?: string | null;
  large?: boolean;
}) {
  return (
    <header className="wood-bar sticky top-0 z-20 shrink-0 px-4 pb-3 pt-4 shadow-[0_8px_20px_rgba(82,36,14,0.18)]">
      <div className="flex items-center justify-between gap-3">
        {leading ??
          (onBack ? (
            <button type="button" aria-label="뒤로가기" onClick={onBack} className={backClass}>
              ←
            </button>
          ) : (
            <Link href={backHref} aria-label="뒤로가기" className={backClass}>
              ←
            </Link>
          ))}
        <div className="relative self-stretch text-center">
          <div className="flex h-full flex-col items-center justify-center">
            <p
              className={`flex items-center justify-center gap-2 font-[family-name:var(--font-display)] font-bold tracking-tight text-hanji-main ${large ? "-translate-y-1 text-[2rem]" : "text-[1.35rem]"}`}
            >
              {mark ? <span className="w-[4.5rem] shrink-0" aria-hidden /> : null}
              {title}
            </p>
            {subtitle ? <p className="text-[0.7rem] tracking-[0.18em] text-hanji-soft/90">{subtitle}</p> : null}
          </div>
          {mark ? <span className="absolute top-1/2 left-0 -translate-y-1/2">{mark}</span> : null}
        </div>
        {right ?? <span className="h-10 w-10" />}
      </div>
    </header>
  );
}
