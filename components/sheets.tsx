"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/data/market";
import { CloseIcon } from "@/components/icons";
import type { EventBanner } from "@/lib/event-banner";

function useEscape(onClose: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

export function StoreDetail({ store, onClose }: { store: Store; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-[#2a2118]/45" onClick={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-detail-title"
        className="sheet-rise max-h-[78%] overflow-y-auto rounded-t-[1.7rem] bg-[#fffaf3] px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(42,33,24,0.18)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#eadfd2]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#9b2335]">{store.category}</p>
            <h2 id="store-detail-title" className="font-display mt-1 text-[1.7rem] leading-8 text-[#2a2118]">
              {store.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="가게 정보 닫기"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#2a2118] ring-1 ring-[#2a2118]/10"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#4e4338]">{store.description}</p>

        <h3 className="mt-5 text-xs font-semibold tracking-wide text-[#8a7b6c]">이 가게에서</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {store.notes.map((item) => (
            <li key={item} className="rounded-full bg-[#f6ebe1] px-3 py-1 text-xs font-medium text-[#6a3a32]">
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-sm text-[#5c5146]">
          위치 <span className="font-medium text-[#2a2118]">{store.place}</span>
        </p>
      </div>
    </div>
  );
}

export function EventSheet({ banner, onClose }: { banner: EventBanner; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-[#2a2118]/45" onClick={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className="sheet-rise flex max-h-[78%] flex-col overflow-hidden rounded-t-[1.7rem] bg-[#fffaf3] shadow-[0_-16px_50px_rgba(42,33,24,0.18)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-br from-[#221a4a] via-[#3a2770] to-[#6a3a4a] px-5 pt-4 pb-5 text-white">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/35" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#f6e7b4]">{banner.sheet.badge}</p>
              <h2 id="event-title" className="font-display mt-1 text-[1.65rem] leading-8">
                {banner.sheet.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="행사 안내 닫기"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/20"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/85">{banner.sheet.summary}</p>
        </div>
        <div className="overflow-y-auto">
          {banner.sheet.rows.length ? (
            <dl className="space-y-3 px-5 py-4 text-sm">
              {banner.sheet.rows.map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] font-semibold text-[#8a7b6c]">{row.label}</dt>
                  <dd className="mt-0.5 leading-6 whitespace-pre-line text-[#2a2118]">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {banner.sheet.link ? (
            <div className="px-5 pt-1 pb-5">
              <a
                href={banner.sheet.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-[#9b2335] px-3 py-2 text-sm font-semibold text-white"
              >
                공식 안내 열기
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AccountSheet({
  name,
  onClose,
  onSave,
  onLogout,
}: {
  name: string | null;
  onClose: () => void;
  onSave: (name: string) => void;
  onLogout: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(name ?? "");
  useEscape(onClose);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center bg-[#2a2118]/45 px-5 pt-20"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        className="sheet-rise w-full max-w-[320px] rounded-[1.6rem] bg-[#fffaf3] p-5 shadow-[0_24px_60px_rgba(42,33,24,0.22)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="account-title" className="font-display text-2xl text-[#2a2118]">
            {name ? "프로필" : "시장에 들르기"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#2a2118] ring-1 ring-[#2a2118]/10"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {name ? (
          <div className="mt-4">
            <p className="text-sm leading-6 text-[#5c5146]">
              <span className="font-medium text-[#2a2118]">{name}</span> 님으로 이 브라우저에 남아 있습니다.
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 h-11 w-full rounded-2xl bg-[#9b2335] text-sm font-semibold text-white"
            >
              나가기
            </button>
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              const next = draft.trim();
              if (!next) return;
              onSave(next.slice(0, 12));
            }}
          >
            <p className="text-sm leading-6 text-[#5c5146]">이름을 남기면 오른쪽 프로필 버튼에 표시됩니다.</p>
            <label className="mt-3 block text-xs font-semibold text-[#8a7b6c]" htmlFor="visitor-name">
              이름
            </label>
            <input
              id="visitor-name"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={12}
              placeholder="예: 민지"
              className="mt-1 h-12 w-full rounded-2xl border border-[#e6d7c8] bg-white px-3 text-base text-[#2a2118] ring-[#9b2335] outline-none placeholder:text-[#b3a394] focus:ring-2"
            />
            <button
              type="submit"
              className="mt-3 h-11 w-full rounded-2xl bg-[#9b2335] text-sm font-semibold text-white disabled:opacity-40"
              disabled={!draft.trim()}
            >
              들어가기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
