"use client";

import { useEffect, useState } from "react";
import { findStore, type CategoryFilter } from "@/data/market";
import { UserIcon } from "@/components/icons";
import { MarketMap } from "@/components/market-map";
import { RadialMenu } from "@/components/radial-menu";
import { AccountSheet, EventSheet, StoreDetail } from "@/components/sheets";

const NAME_KEY = "sinwon-visitor";

export function HomeScreen() {
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(NAME_KEY);
    if (saved) setUserName(saved);
  }, []);

  function selectCategory(next: CategoryFilter) {
    setCategory(next);
    setBriefId((id) => (kept(id, next) ? id : null));
    setDetailId((id) => (kept(id, next) ? id : null));
  }

  function openDetail(id: string) {
    setBriefId(null);
    setDetailId(id);
    setEventOpen(false);
    setAccountOpen(false);
  }

  const brief = briefId ? findStore(briefId) : null;
  const detail = detailId ? findStore(detailId) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-white shadow-sm ring-1 ring-[#2a2118]/8">
          <span className="font-display grid h-7 w-7 place-items-center rounded-full bg-[#9b2335] text-[13px] text-white">
            신
          </span>
          <span className="font-display truncate text-[1.35rem] tracking-tight text-[#2a2118]">신원시장</span>
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
        className="relative mx-4 mt-3 h-[92px] shrink-0 overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#221a4a] via-[#3a2770] to-[#6a3a4a] px-4 text-left shadow-[0_12px_30px_rgba(40,24,70,0.22)] ring-1 ring-white/10"
      >
        <span className="pointer-events-none absolute -top-6 -right-3 h-24 w-24 rounded-full bg-[#f6e7b4]/10" />
        <span className="pointer-events-none absolute top-4 right-16 h-1 w-1 rounded-full bg-white" />
        <span className="pointer-events-none absolute top-8 right-8 h-1.5 w-1.5 rounded-full bg-[#f6e7b4]" />
        <span className="pointer-events-none absolute top-10 right-24 h-1 w-1 rounded-full bg-white/80" />
        <span className="inline-flex rounded-full bg-[#f6e7b4] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3a2770]">
          진행 중
        </span>
        <span className="font-display mt-1 block text-[1.55rem] leading-none text-white">별빛내린천</span>
        <span className="mt-1 block text-[13px] leading-4 text-white/85">분수에서 시장 골목까지</span>
        <span className="mt-1 block text-[11px] text-[#f6e7b4]">매일 12:00 · 19:00 · 20:00 · 안내 보기</span>
      </button>

      <p className="shrink-0 px-5 pt-2 text-center text-[11px] tracking-tight text-[#8a7568]">
        빨간 점을 한 번 누르면 요약, 두 번 누르면 가게 정보
      </p>

      <main className="relative z-0 min-h-0 flex-1">
        <MarketMap
          category={category}
          onCategory={selectCategory}
          brief={brief}
          onBrief={setBriefId}
          onOpenDetail={openDetail}
        />
      </main>

      <div className="relative z-20 -mt-6 shrink-0">
        <RadialMenu />
      </div>

      {detail ? <StoreDetail store={detail} onClose={() => setDetailId(null)} /> : null}
      {eventOpen ? <EventSheet onClose={() => setEventOpen(false)} /> : null}
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

function kept(id: string | null, category: CategoryFilter) {
  if (!id) return false;
  const store = findStore(id);
  if (!store) return false;
  return category === "전체" || store.category === category;
}
