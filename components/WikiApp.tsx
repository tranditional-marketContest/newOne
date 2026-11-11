"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyDraft } from "@/lib/apply";
import { withMenuUnit } from "@/lib/menu-board";
import { coerceOrganized } from "@/lib/organize";
import { seedStores, STORE_STORAGE_KEY } from "@/lib/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchStoresFromSupabase, persistWikiSubmission, seedStoresToSupabase, syncStoresToSupabase } from "@/lib/supabase/wiki";
import type { EditorDraft, OrganizedWiki, Store } from "@/lib/types";
import { normalizeMenuName } from "@/lib/units";
import { BackIcon } from "./icons";
import StoreDetail from "./StoreDetail";
import StoreEditor from "./StoreEditor";
import StoreList from "./StoreList";

type Panel = "detail" | "edit";

const firstStoreId = [...seedStores].sort((a, b) => a.name.localeCompare(b.name, "ko"))[0]?.id ?? null;

function normalizeStore(store: Store): Store {
  return {
    ...store,
    reviews: Array.isArray(store.reviews) ? store.reviews : [],
    menus: Array.isArray(store.menus)
      ? store.menus.map((menu) => ({
          ...menu,
          name: normalizeMenuName(menu.name) || menu.name,
          unit: withMenuUnit(menu),
          prices: Array.isArray(menu.prices) ? menu.prices : [],
        }))
      : [],
  };
}

function readStoredWikiStores(): Store[] {
  const raw = localStorage.getItem(STORE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Store[]).map(normalizeStore);
  } catch {
    return [];
  }
}

export default function WikiApp() {
  const [stores, setStores] = useState<Store[]>(seedStores);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(firstStoreId);
  const [panel, setPanel] = useState<Panel>("detail");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [organizing, setOrganizing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        const remote = await fetchStoresFromSupabase();
        if (cancelled) return;

        if (remote && remote.length > 0) {
          setStores(remote);
          setSelectedId(
            [...remote].sort((a, b) => a.name.localeCompare(b.name, "ko"))[0]?.id ?? firstStoreId,
          );
          setHydrated(true);
          return;
        }

        const localStores = readStoredWikiStores();
        await seedStoresToSupabase(localStores.length > 0 ? localStores : seedStores);
        const seeded = await fetchStoresFromSupabase();
        if (cancelled) return;
        if (seeded && seeded.length > 0) {
          setStores(seeded);
          setSelectedId(
            [...seeded].sort((a, b) => a.name.localeCompare(b.name, "ko"))[0]?.id ?? firstStoreId,
          );
          setHydrated(true);
          return;
        }
      }

      const raw = localStorage.getItem(STORE_STORAGE_KEY);
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStores(
              (parsed as Store[]).map(normalizeStore),
            );
          }
        } catch {
          localStorage.removeItem(STORE_STORAGE_KEY);
        }
      }
      if (!cancelled) setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(stores));
    if (!isSupabaseConfigured()) return;
    void syncStoresToSupabase(stores);
  }, [hydrated, stores]);

  const visibleStores = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return stores
      .filter((store) => {
        if (!keyword) return true;
        const haystack = [store.name, store.category, store.items, ...store.menus.map((menu) => menu.name)]
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [query, stores]);

  const selected = stores.find((store) => store.id === selectedId) ?? null;

  function selectStore(id: string) {
    setSelectedId(id);
    setPanel("detail");
    setSidebarOpen(false);
    setNotice(null);
  }

  async function summarizeCharacter(store: Store): Promise<{ character: string; notice: string }> {
    const reviews = (store.reviews ?? [])
      .map((review) => review.text.trim())
      .filter((text) => text.length > 1);
    if (reviews.length === 0) return { character: store.character, notice: "" };

    const response = await fetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName: store.name,
        category: store.category,
        reviews,
      }),
    });
    const payload: { character?: string; notice?: string; error?: string } = await response.json();
    if (!response.ok) throw new Error(payload.error || "가게 성격 정리에 실패했습니다.");
    return {
      character: payload.character?.trim() || store.character,
      notice: payload.notice?.trim() ?? "",
    };
  }

  async function submitDraft(draft: EditorDraft) {
    if (!selected || organizing) return;
    const text = draft.text.trim();
    let organized: OrganizedWiki | null = null;
    let nextNotice: string | null = null;
    const started = Date.now();
    const needsAi = Boolean(text);

    if (needsAi) setOrganizing(true);

    if (text) {
      try {
        const response = await fetch("/api/organize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            storeName: draft.name,
            category: draft.category,
          }),
        });
        const payload: { result?: unknown; notice?: string; error?: string } = await response.json();
        if (!response.ok) throw new Error(payload.error || "정리에 실패했습니다.");
        organized = coerceOrganized(payload.result, draft.category);
        if (!organized) throw new Error("정리 결과를 읽지 못했습니다.");
      } catch (error) {
        nextNotice = error instanceof Error ? error.message : "정리에 실패했습니다.";
        organized = null;
        const wait = 900 - (Date.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        setOrganizing(false);
        setNotice(nextNotice);
        setPanel("detail");
        return;
      }
    }

    let nextStore = applyDraft(selected, draft, organized);
    const proseCount = (nextStore.reviews ?? []).filter((review) => review.text.trim()).length;

    if (proseCount > 0) {
      if (!needsAi) setOrganizing(true);
      try {
        const summary = await summarizeCharacter(nextStore);
        nextStore = { ...nextStore, character: summary.character };
      } catch {
        // 성격 요약 실패 시 기존·organize 결과 유지
      }
    }

    if (isSupabaseConfigured()) {
      const saved = await persistWikiSubmission({
        store: nextStore,
        draft,
        organized,
      });
      if (!saved.ok) {
        nextNotice = saved.message || "Supabase 저장에 실패했습니다.";
      } else {
        const refreshed = await fetchStoresFromSupabase();
        if (refreshed) {
          nextStore = refreshed.find((store) => store.id === selected.id) ?? nextStore;
          setStores(refreshed);
          const wait = 900 - (Date.now() - started);
          if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
          setOrganizing(false);
          setNotice(null);
          setPanel("detail");
          return;
        }
      }
    }

    const wait = 900 - (Date.now() - started);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    setOrganizing(false);
    setStores((current) => current.map((store) => (store.id === selected.id ? nextStore : store)));
    setNotice(nextNotice);
    setPanel("detail");
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f3ecdf]">
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-1 md:px-5">
        <Link
          href="/"
          aria-label="메인 지도로"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#2a2118] shadow-sm ring-1 ring-[#2a2118]/10"
        >
          <BackIcon className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-[#c4492c]">신원시장</p>
          <h1 className="text-2xl font-bold tracking-tight">신원위키</h1>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 p-3 md:px-5 md:pb-5">
        <div className="h-full min-h-0">
          {selected && panel === "edit" ? (
            <StoreEditor
              key={selected.id}
              store={selected}
              busy={organizing}
              onCancel={() => setPanel("detail")}
              onSubmit={(draft) => void submitDraft(draft)}
            />
          ) : selected ? (
            <StoreDetail
              store={selected}
              notice={notice}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onEdit={() => {
                setNotice(null);
                setPanel("edit");
              }}
            />
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[#e4d8c6] bg-white px-4 text-center text-sm text-stone-500">
              <div>
                <button
                  type="button"
                  aria-expanded={sidebarOpen}
                  aria-controls="wiki-store-sidebar"
                  onClick={() => setSidebarOpen(true)}
                  className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#fffaf3] text-[#2a2118] ring-1 ring-[#2a2118]/10"
                  aria-label="가게 목록 열기"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none">
                    <path
                      d="M5 7.5h14M5 12h14M5 16.5h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                목록에서 가게를 선택해 주세요.
              </div>
            </div>
          )}
        </div>

        <div
          className={`absolute inset-0 z-20 bg-[#241c17]/35 transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

        <aside
          id="wiki-store-sidebar"
          className={`absolute inset-y-3 left-3 z-30 w-[min(100%-1.5rem,300px)] transition-transform duration-200 ease-out md:inset-y-0 md:left-0 md:my-0 md:w-[300px] ${
            sidebarOpen ? "translate-x-0" : "pointer-events-none -translate-x-[calc(100%+0.75rem)]"
          }`}
        >
          <StoreList
            query={query}
            stores={visibleStores}
            selectedId={selected?.id ?? null}
            onQueryChange={setQuery}
            onSelect={selectStore}
          />
        </aside>
      </main>

      {organizing ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-[#241c17]/45 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-7 text-center shadow-xl">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#e7f6df] border-t-[#1f7a45]" />
            <p className="mt-4 text-lg font-bold">AI가 정리하고 있어요</p>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              자유 형식 글을 메뉴, 가격, 운영시간으로 나누는 중입니다.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
