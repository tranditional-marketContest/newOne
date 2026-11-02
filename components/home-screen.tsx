"use client";

import { useEffect, useState } from "react";
import { categoryFilters, findStore, type Store } from "@/data/market";
import { UserIcon } from "@/components/icons";
import { MarketMap } from "@/components/market-map";
import { RadialMenu } from "@/components/radial-menu";
import { AccountSheet, EventSheet, StoreDetail } from "@/components/sheets";
import type { EventBanner } from "@/lib/event-banner";

const NAME_KEY = "sinwon-visitor";

export function HomeScreen({ banner, stores }: { banner: EventBanner; stores: Store[] }) {
  const categories = categoryFilters(stores);
  const [category, setCategory] = useState("전체");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(NAME_KEY);
    if (saved) setUserName(saved);
  }, []);

  function selectCategory(next: string) {
    setCategory(next);
    setBriefId((id) => (kept(stores, id, next) ? id : null));
    setDetailId((id) => (kept(stores, id, next) ? id : null));
  }

  function openDetail(id: string) {
    setBriefId(null);
    setDetailId(id);
    setEventOpen(false);
    setAccountOpen(false);
  }

  const brief = briefId ? findStore(stores, briefId) : null;
  const detail = detailId ? findStore(stores, detailId) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-white shadow-sm ring-1 ring-[#2a2118]/8">
          <span className="font-display grid h-7 w-7 place-items-center rounded-full bg-[#9b2335] text-[13px] text-white">
            新
          </span>
          <span className="truncate text-[1.35rem] font-semibold tracking-tight text-[#2a2118]">new-one</span>
        </div>
        <button
          type="button"
          aria-label={userName ? `${userName} 프로필` : "로그인 및 프로필"}
          onClick={() => {
            setAccountOpen(true);
            setEventOpen(false);
            setBriefId(null);
          }}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#9b2335] shadow-sm ring-1 ring-[#2a2118]/10"
        >
          {userName ? (
            <span className="font-display text-lg leading-none">{userName.slice(0, 1)}</span>
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
        </button>
      </header>

      <button
        type="button"
        onClick={() => {
          setEventOpen(true);
          setAccountOpen(false);
          setBriefId(null);
        }}
        aria-label={
          banner.kind === "fountain"
            ? `${banner.title}. ${banner.subtitle}. ${banner.meta}. 약 20분`
            : `${banner.badge === "안내" ? "" : `${banner.badge} `}${banner.sheet.title}. ${banner.subtitle}${banner.meta ? `. ${banner.meta}` : ""}`
        }
        className={`relative mx-4 mt-3 flex h-[92px] shrink-0 flex-col overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#221a4a] via-[#3a2770] to-[#6a3a4a] px-4 text-left shadow-[0_12px_30px_rgba(40,24,70,0.22)] ring-1 ring-white/10 ${banner.kind === "fountain" ? "justify-center" : "justify-end pb-5"}`}
      >
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#221a4a]/92 via-[#3a2770]/78 to-[#221a4a]/35" />
        <span className="pointer-events-none absolute -top-6 -right-3 h-24 w-24 rounded-full bg-[#f6e7b4]/10" />
        <span className="pointer-events-none absolute top-4 right-16 h-1 w-1 rounded-full bg-white" />
        <span className="pointer-events-none absolute top-8 right-8 h-1.5 w-1.5 rounded-full bg-[#f6e7b4]" />
        <span className="pointer-events-none absolute top-10 right-24 h-1 w-1 rounded-full bg-white/80" />
        {banner.kind === "fountain" ? (
          <>
            <span className="font-display relative block truncate text-[1.35rem] leading-none text-white">{banner.title}</span>
            <span className="relative mt-1.5 block truncate text-[15px] leading-5 text-white/85">{banner.subtitle}</span>
            <span className="relative mt-1 block truncate text-[13px] leading-4 text-white/85">
              {banner.meta} <span className="text-[#f6e7b4]">약 20분</span>
            </span>
          </>
        ) : (
          <>
            {banner.badge === "안내" ? null : (
              <span className="relative inline-flex w-fit rounded-full bg-[#f6e7b4] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3a2770]">
                {banner.badge}
              </span>
            )}
            <span className="font-display relative mt-1 block truncate text-[1.55rem] leading-none text-white">{banner.title}</span>
            <span className="relative mt-2 block truncate text-[13px] leading-4 text-white/85">{banner.subtitle}</span>
            {banner.meta ? (
              <span className="relative mt-1 block truncate text-[11px] text-[#f6e7b4]">{banner.meta}</span>
            ) : null}
          </>
        )}
      </button>

      <p className="shrink-0 px-5 pt-2 text-center text-[11px] tracking-tight text-[#8a7568]">
        빨간 점을 한 번 누르면 요약, 두 번 누르면 가게 정보
      </p>

      <main className="relative z-0 min-h-0 flex-1">
        <MarketMap
          stores={stores}
          categories={categories}
          category={category}
          onCategory={selectCategory}
          brief={brief}
          onBrief={setBriefId}
          onOpenDetail={openDetail}
        />
      </main>

      <div className="relative z-20 -mt-6 mb-3 shrink-0">
        <RadialMenu />
      </div>

      {detail ? <StoreDetail store={detail} onClose={() => setDetailId(null)} /> : null}
      {eventOpen ? <EventSheet banner={banner} onClose={() => setEventOpen(false)} /> : null}
      {accountOpen ? (
        <AccountSheet
          name={userName}
          onClose={() => setAccountOpen(false)}
          onSave={(next) => {
            window.sessionStorage.setItem(NAME_KEY, next);
            setUserName(next);
            setAccountOpen(false);
          }}
          onLogout={() => {
            window.sessionStorage.removeItem(NAME_KEY);
            setUserName(null);
            setAccountOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function kept(stores: Store[], id: string | null, category: string) {
  if (!id) return false;
  const store = findStore(stores, id);
  if (!store) return false;
  return category === "전체" || store.category === category;
}
