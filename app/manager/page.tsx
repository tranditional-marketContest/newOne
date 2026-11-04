"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarketMap } from "@/components/MarketMap";
import { PhoneShell } from "@/components/PhoneShell";
import {
  STORE_CATEGORIES,
  type StoreCategory,
} from "@/data/stores";
import { useStores } from "@/hooks/useStores";
import { clearManagerAuthed, isManagerAuthed } from "@/lib/managerAuth";

type Tab = "register" | "delete";

export default function ManagerPage() {
  const router = useRouter();
  const { stores, ready, addStore, removeStore } = useStores();
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

  useEffect(() => {
    if (!isManagerAuthed()) {
      router.replace("/mypage");
      return;
    }
    setAuthed(true);
    setChecking(false);
  }, [router]);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedId) ?? null,
    [stores, selectedId],
  );

  function handleRegister() {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("점포 이름을 입력해 주세요.");
      return;
    }
    if (!pendingPin) {
      setMessage("지도에서 가게 위치를 찍어 주세요.");
      return;
    }
    addStore({
      name: trimmed,
      category,
      x: pendingPin.x,
      y: pendingPin.y,
    });
    setName("");
    setCategory("식자재");
    setPendingPin(null);
    setMessage(`「${trimmed}」(${category})을(를) 등록했습니다.`);
  }

  function handleDelete(id: string, storeName: string) {
    removeStore(id);
    if (selectedId === id) setSelectedId(null);
    setMessage(`「${storeName}」을(를) 삭제했습니다.`);
  }

  if (checking || !authed) {
    return (
      <PhoneShell className="items-center justify-center">
        <p className="text-[15px] text-[#6f675c]">인증 확인 중…</p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
        <header className="flex items-center gap-3">
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
          className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5"
          role="tablist"
          aria-label="매니저 기능"
        >
          <TabButton
            active={tab === "register"}
            onClick={() => {
              setTab("register");
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
              setMessage(null);
            }}
          >
            삭제
          </TabButton>
        </div>

        {!ready ? (
          <p className="mt-8 text-[15px] text-[#6f675c]">지도 불러오는 중…</p>
        ) : tab === "register" ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-[14px] leading-6 text-[#4d463d]">
              지도를 확대·이동한 뒤, 점포 자리를 눌러 빨간 점을 찍고 이름과
              카테고리를 등록하세요.
            </p>

            <MarketMap
              stores={stores}
              placeMode
              pendingPin={pendingPin}
              onPlacePin={(pin) => {
                setPendingPin(pin);
                setMessage(null);
              }}
            />

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
              onClick={handleRegister}
              className="h-14 w-full rounded-2xl bg-[#234237] text-[16px] font-bold text-white"
            >
              가게 등록하기
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-[14px] leading-6 text-[#4d463d]">
              등록된 상점을 확인하고, 없어진 가게는 목록에서 삭제하세요.
            </p>

            <MarketMap
              stores={stores}
              selectedId={selectedId}
              onSelectStore={setSelectedId}
            />

            <ul className="flex flex-col gap-3">
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
                          onClick={() => setSelectedId(store.id)}
                        >
                          <span className="size-3 shrink-0 rounded-full bg-[#e23a2b]" />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-bold">
                              {store.name}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-[#8a8174]">
                              {store.category} · 위치 {store.x.toFixed(0)},{" "}
                              {store.y.toFixed(0)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(store.id, store.name)}
                          className="h-10 shrink-0 rounded-xl bg-[#f6e6e2] px-3 text-[13px] font-bold text-[#a6452f]"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            {selectedStore ? (
              <p className="text-[13px] text-[#6f675c]">
                선택됨:{" "}
                <span className="font-medium text-[#234237]">
                  {selectedStore.name}
                </span>
              </p>
            ) : null}
          </div>
        )}

        {message ? (
          <p className="mt-4 text-[13px] leading-5 text-[#234237]">{message}</p>
        ) : null}
    </PhoneShell>
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
