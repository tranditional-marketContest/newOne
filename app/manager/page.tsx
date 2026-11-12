"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppFrame } from "@/components/app-frame";
import { BlockMarketMap } from "@/components/block-market-map";
import { StoreDetail } from "@/components/sheets";
import { categoryFilters, storeSummary, type Store } from "@/data/market";
import { STORE_CATEGORIES, type StoreCategory } from "@/data/stores";
import { clearManagerAuthed, isManagerAuthed } from "@/lib/managerAuth";
import { loadStoresForMap } from "@/lib/market-stores";
import { deleteStoreFromSupabase, insertStoreToSupabase } from "@/lib/storesApi";

type Tab = "register" | "delete";

export default function ManagerPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [ready, setReady] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("register");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StoreCategory>("식자재");
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isManagerAuthed()) {
      router.replace("/mypage");
      return;
    }
    setAuthed(true);
    setChecking(false);
    void loadStoresForMap().then((next) => {
      setStores(next);
      setReady(true);
    });
  }, [router]);

  const categories = categoryFilters(stores);
  const brief = stores.find((store) => store.id === briefId) ?? null;
  const detail = stores.find((store) => store.id === detailId) ?? null;

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedId) ?? null,
    [stores, selectedId],
  );

  async function reloadStores() {
    const next = await loadStoresForMap();
    setStores(next);
    setReady(true);
  }

  async function handleRegister() {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("점포 이름을 입력해 주세요.");
      return;
    }
    if (!pendingPin) {
      setMessage("지도에서 가게 위치를 찍어 주세요.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await insertStoreToSupabase({ name: trimmed, category, x: pendingPin.x, y: pendingPin.y });
      await reloadStores();
      setName("");
      setCategory("식자재");
      setPendingPin(null);
      setMessage(`「${trimmed}」(${category})을(를) 등록했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "가게를 등록하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, storeName: string) {
    setSaving(true);
    setMessage(null);
    setPendingDelete(null);
    try {
      await deleteStoreFromSupabase(id);
      if (selectedId === id) setSelectedId(null);
      if (briefId === id) setBriefId(null);
      if (detailId === id) setDetailId(null);
      await reloadStores();
      setMessage(`「${storeName}」을(를) 삭제했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "가게를 삭제하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (checking || !authed) {
    return (
      <AppFrame>
        <div className="flex h-full items-center justify-center bg-[#f7f3ea]">
          <p className="text-[15px] text-[#6f675c]">인증 확인 중…</p>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <div className="relative flex h-full min-h-0 flex-col bg-[#f7f3ea] text-[#1c1915]">
        <header className="flex shrink-0 items-center gap-3 px-4 pt-4">
          <Link
            href="/mypage"
            onClick={() => clearManagerAuthed()}
            className="flex size-10 items-center justify-center rounded-xl text-[#234237]"
            aria-label="마이페이지로 돌아가기"
          >
            <BackIcon />
          </Link>
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-wide text-[#6f675c]">
              신원시장 · 매니저
            </p>
            <h1 className="text-[24px] font-bold tracking-tight">점포 관리</h1>
          </div>
        </header>

        <div
          className="mx-4 mt-4 grid shrink-0 grid-cols-2 gap-2 rounded-2xl bg-white p-1.5"
          role="tablist"
          aria-label="매니저 기능"
        >
          <TabButton
            active={tab === "register"}
            onClick={() => {
              setTab("register");
              setPendingDelete(null);
              setMessage(null);
            }}
          >
            등록
          </TabButton>
          <TabButton
            active={tab === "delete"}
            onClick={() => {
              setTab("delete");
              setPendingPin(null);
              setPendingDelete(null);
              setMessage(null);
            }}
          >
            삭제
          </TabButton>
        </div>

        {!ready ? (
          <p className="mt-8 px-4 text-[15px] text-[#6f675c]">지도 불러오는 중…</p>
        ) : tab === "register" ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <BlockMarketMap
                stores={stores}
                categories={categories}
                category={categoryFilter}
                onCategory={setCategoryFilter}
                brief={brief}
                onBrief={setBriefId}
                onOpenDetail={setDetailId}
                placeMode
                pendingPin={pendingPin}
                onPlacePin={(pin) => {
                  setPendingPin(pin);
                  setMessage(null);
                }}
              />
            </div>

            <div className="flex max-h-[34%] shrink-0 flex-col gap-3 overflow-auto border-t border-[#ddd3c3] bg-[#f7f3ea] px-4 pt-3 pb-4">
            <label className="block">
              <span className="text-[13px] font-medium text-[#6f675c]">
                점포 이름
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 고은이네"
                className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c3] bg-white px-4 text-[15px] outline-none focus:border-[#234237]"
              />
            </label>

            <fieldset>
              <legend className="text-[13px] font-medium text-[#6f675c]">
                카테고리
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STORE_CATEGORIES.map((item) => {
                  const active = category === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`h-11 rounded-xl text-[13px] font-bold transition-colors ${
                        active
                          ? "bg-[#234237] text-white"
                          : "bg-white text-[#4d463d] ring-1 ring-[#ddd3c3]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-2xl bg-white px-4 py-3 text-[13px] text-[#6f675c]">
              {pendingPin ? (
                <p>
                  선택한 위치{" "}
                  <span className="font-medium text-[#234237]">
                    x {pendingPin.x.toFixed(1)} · y {pendingPin.y.toFixed(1)}
                  </span>
                </p>
              ) : (
                <p>아직 지도에 위치를 찍지 않았습니다.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleRegister()}
              disabled={saving}
              className="h-16 w-full shrink-0 rounded-2xl bg-[#234237] text-[16px] font-bold text-white disabled:opacity-60"
            >
              {saving ? "등록하는 중…" : "가게 등록하기"}
            </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <BlockMarketMap
                stores={stores}
                categories={categories}
                category={categoryFilter}
                onCategory={setCategoryFilter}
                brief={brief}
                onBrief={(id) => {
                  setBriefId(id);
                  setSelectedId(id);
                }}
                onOpenDetail={setDetailId}
                onDelete={(store) => setPendingDelete({ id: store.id, name: store.name })}
              />
            </div>

            <ul className="flex max-h-[34%] shrink-0 flex-col gap-3 overflow-auto border-t border-[#ddd3c3] bg-[#f7f3ea] px-4 pt-3 pb-4">
              {stores.length === 0 ? (
                <li className="rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-[#8a8174]">
                  등록된 가게가 없습니다.
                </li>
              ) : (
                stores.map((store) => {
                  const active = store.id === selectedId;
                  return (
                    <li key={store.id}>
                      <div
                        className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ${
                          active ? "ring-2 ring-[#234237]/35" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          onClick={() => {
                            setSelectedId(store.id);
                            setBriefId(store.id);
                          }}
                        >
                          <span className="size-3 shrink-0 rounded-full bg-[#e23a2b]" />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-bold">
                              {store.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-[#8a8174]">
                              {store.category} · {storeSummary(store)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ id: store.id, name: store.name })}
                          disabled={saving}
                          className="h-10 shrink-0 rounded-xl bg-[#f6e6e2] px-3 text-[13px] font-bold text-[#a6452f]"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
              {selectedStore ? (
                <li className="px-1 text-[13px] text-[#6f675c]">
                  선택됨: <span className="font-medium text-[#234237]">{selectedStore.name}</span>
                </li>
              ) : null}
            </ul>
          </div>
        )}

        {message ? (
          <p className="shrink-0 px-4 pb-3 text-[13px] leading-5 text-[#234237]">{message}</p>
        ) : null}
        {detail ? <StoreDetail store={detail} onClose={() => setDetailId(null)} /> : null}
        {pendingDelete ? (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-[#2a2118]/45 px-4 pb-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              className="w-full rounded-[1.6rem] bg-[#fffaf3] p-5 shadow-[0_24px_60px_rgba(42,33,24,0.22)]"
            >
              <h2 id="delete-confirm-title" className="text-center text-[18px] font-bold text-[#2a2118]">
                가게를 삭제하시겠습니까?
              </h2>
              <p className="mt-2 text-center text-[14px] text-[#6f675c]">{pendingDelete.name}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void handleDelete(pendingDelete.id, pendingDelete.name)}
                  disabled={saving}
                  className="h-12 rounded-2xl bg-[#a6452f] text-[15px] font-bold text-white disabled:opacity-60"
                >
                  삭제
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={saving}
                  className="h-12 rounded-2xl bg-white text-[15px] font-bold text-[#2a2118] ring-1 ring-[#2a2118]/10"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppFrame>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-11 rounded-xl text-[15px] font-bold transition-colors ${
        active ? "bg-[#234237] text-white" : "bg-transparent text-[#6f675c]"
      }`}
    >
      {children}
    </button>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
