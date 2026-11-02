"use client";

import { useEffect, useMemo, useState } from "react";
import { applyDraft } from "@/lib/apply";
import { coerceOrganized } from "@/lib/organize";
import { seedStores, STORE_STORAGE_KEY } from "@/lib/seed";
import type { EditorDraft, OrganizedWiki, Store } from "@/lib/types";
import StoreDetail from "./StoreDetail";
import StoreEditor from "./StoreEditor";
import StoreList from "./StoreList";

type Panel = "list" | "detail" | "edit";

const firstStoreId = [...seedStores].sort((a, b) => a.name.localeCompare(b.name, "ko"))[0]?.id ?? null;

export default function WikiApp() {
  const [stores, setStores] = useState<Store[]>(seedStores);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(firstStoreId);
  const [panel, setPanel] = useState<Panel>("list");
  const [organizing, setOrganizing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStores(
            (parsed as Store[]).map((store) => ({
              ...store,
              reviews: Array.isArray(store.reviews) ? store.reviews : [],
            })),
          );
        }
      } catch {
        localStorage.removeItem(STORE_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(stores));
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
    let nextNotice = "수정한 내용을 위키에 반영했습니다.";
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
        nextNotice = payload.notice?.trim() ?? "";
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
        if (summary.notice) nextNotice = summary.notice;
      } catch {
        // 성격 요약 실패 시 기존·organize 결과 유지
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
    <div className="flex h-dvh flex-col">
      <header className="px-4 pt-4 pb-1 md:px-5">
        <p className="text-xs font-semibold tracking-wide text-[#c4492c]">신원시장</p>
        <h1 className="text-2xl font-bold tracking-tight">신원위키</h1>
      </header>
      <main className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[300px_minmax(0,1fr)] md:px-5 md:pb-5">
        <div className={`h-full min-h-0 ${panel === "list" ? "block" : "hidden md:block"}`}>
          <StoreList
            query={query}
            stores={visibleStores}
            selectedId={selected?.id ?? null}
            onQueryChange={setQuery}
            onSelect={selectStore}
          />
        </div>
        <div className={`h-full min-h-0 ${panel === "list" ? "hidden md:block" : "block"}`}>
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
              onEdit={() => {
                setNotice(null);
                setPanel("edit");
              }}
              onBack={() => setPanel("list")}
            />
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[#e4d8c6] bg-white text-sm text-stone-500">
              가게를 선택해 주세요.
            </div>
          )}
        </div>
      </main>

      {organizing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#241c17]/45 px-6">
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
