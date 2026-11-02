"use client";

import { useMemo, useState } from "react";
import { applyDraft } from "@/lib/apply";
import { boardMenus, isPer100g, menuBaseName } from "@/lib/menu-board";
import { seoulToday, summarizePrices } from "@/lib/price";
import type { EditorDraft, Store } from "@/lib/types";
import WikiTable from "./WikiTable";

type StoreEditorProps = {
  store: Store;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: EditorDraft) => void;
};

const fieldClass =
  "w-full rounded-lg border border-[#e4d8c6] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f7a45]";

function menuLabel(name: string): string {
  if (isPer100g(name)) return `${menuBaseName(name)} · 100g당`;
  return name;
}

const CUSTOM_MENU = "__custom__";

function emptyMenuRow(custom = false): EditorDraft["menus"][number] {
  return { key: crypto.randomUUID(), name: "", grams: "100", price: "", custom };
}

function createDraft(store: Store): EditorDraft {
  return {
    name: store.name,
    category: store.category,
    hours: store.hours,
    items: store.items,
    purchaseHour: "",
    purchasedItems: "",
    character: "",
    discount: "",
    note: "",
    date: seoulToday(),
    photos: [],
    text: "",
    menus: [emptyMenuRow()],
  };
}

async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 올릴 수 있습니다.");
  if (file.size > 1_500_000) throw new Error("사진은 1.5MB 이하로 올려 주세요.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

type WriteMode = "prose" | "fields";

export default function StoreEditor({ store, busy, onCancel, onSubmit }: StoreEditorProps) {
  const [draft, setDraft] = useState<EditorDraft>(() => createDraft(store));
  const [mode, setMode] = useState<WriteMode>("prose");
  const [photoError, setPhotoError] = useState("");
  const menuOptions = useMemo(() => boardMenus(store.menus), [store.menus]);
  const preview = useMemo(() => applyDraft(store, { ...draft, text: "" }, null), [store, draft]);
  const unusedMenus = menuOptions.filter((option) => !draft.menus.some((menu) => menu.name === option.name));

  function patch(partial: Partial<EditorDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function optionsForRow(selectedName: string) {
    return menuOptions.filter(
      (option) => option.name === selectedName || !draft.menus.some((menu) => menu.name === option.name),
    );
  }

  async function addPhoto(file: File) {
    try {
      const photo = await readPhoto(file);
      setPhotoError("");
      setDraft((current) => ({ ...current, photos: [...current.photos, photo].slice(0, 4) }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "사진을 올리지 못했습니다.");
    }
  }

  return (
    <form
      className="flex h-full min-h-0 flex-col rounded-2xl border border-[#e4d8c6] bg-white"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.name.trim() || busy) return;
        if (mode === "prose") {
          if (!draft.text.trim()) return;
          onSubmit({
            ...draft,
            menus: draft.menus.map((menu) => ({ ...menu, price: "" })),
          });
          return;
        }
        onSubmit({ ...draft, text: "" });
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#efe4d4] px-4 py-3">
        <h2 className="text-lg font-bold">후기 남기기</h2>
        <button type="button" onClick={onCancel} className="text-sm text-stone-500 hover:text-[#c4492c]">
          취소
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <div role="radiogroup" aria-label="후기 작성 방식" className="grid grid-cols-2 gap-1 rounded-xl bg-[#f6f0e6] p-1">
            {(
              [
                ["prose", "줄글로 적기"],
                ["fields", "직접 입력"],
              ] as const
            ).map(([value, label]) => {
              const selected = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMode(value)}
                  className={`h-10 rounded-lg text-sm font-semibold ${
                    selected ? "bg-white text-[#241c17] shadow-sm" : "text-stone-500 hover:text-[#241c17]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            {mode === "prose"
              ? "다녀온 이야기를 쓰면 메뉴, 가격, 운영시간으로 나눠 적습니다."
              : "메뉴는 목록에서 고르거나 새로 추가하고, 날짜·시간과 구매품목을 적습니다."}
          </p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-bold text-stone-500">가게 이름</span>
          <p className="rounded-lg border border-[#efe4d4] bg-[#faf6ef] px-3 py-2 text-sm font-medium text-[#241c17]">
            {draft.name}
          </p>
        </div>

        {mode === "prose" ? (
        <section className="rounded-xl border border-[#8fce9f] bg-[#e7f6df] p-3">
          <h3 className="text-sm font-bold text-[#1d5c32]">AI 자동입력</h3>
          <p className="mt-1 text-xs leading-5 text-[#246b3d]">
            블로그 글이든 리뷰 줄글이든 형식 없이 붙여 넣으면 됩니다.
          </p>
          <textarea
            value={draft.text}
            onChange={(event) => patch({ text: event.target.value })}
            placeholder="오늘 들렀는데 모듬순대가 14,000원이었다. 국물이 진하고 포장도 된다. 오전 10시부터 밤 9시까지."
            className="mt-2 min-h-36 w-full resize-y rounded-lg border border-[#b7dfc0] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#1f7a45]"
          />
        </section>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500">
              사진 <span className="font-medium text-stone-400">선택</span>
            </h3>
            <span className="text-xs text-stone-400">{draft.photos.length}/4</span>
          </div>
          <div className="flex gap-2">
            {draft.photos.map((photo, index) => (
              <div key={`${index}-${photo.slice(0, 24)}`} className="relative size-16 overflow-hidden rounded-lg border border-[#e4d8c6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="사진 삭제"
                  onClick={() =>
                    patch({ photos: draft.photos.filter((_, photoIndex) => photoIndex !== index) })
                  }
                  className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-black/60 text-[10px] text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {draft.photos.length < 4 ? (
              <label className="grid size-16 cursor-pointer place-items-center rounded-lg border border-dashed border-[#c9b79d] text-2xl text-stone-500">
                <span className="sr-only">사진 추가</span>+
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void addPhoto(file);
                  }}
                />
              </label>
            ) : null}
          </div>
          {photoError ? <p className="mt-1 text-xs text-[#c4492c]">{photoError}</p> : null}
        </section>

        {mode === "fields" ? (
        <>
        <section className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_112px_36px] gap-2 text-xs font-bold text-stone-500">
            <span>메뉴</span>
            <span>그람수</span>
            <span>총 가격</span>
            <span className="sr-only">행</span>
          </div>
          {draft.menus.map((menu, index) => {
            const current = store.menus.find((item) => item.name === menu.name || item.id === menu.key);
            const average = current ? summarizePrices(current.prices).average : null;
            const isCustom = Boolean(menu.custom);
            const grams = Math.max(1, Math.round(Number(menu.grams) || 100));
            const total = Number(menu.price.replace(/,/g, ""));
            const unitPreview =
              Number.isFinite(total) && total > 0 ? Math.round((total / grams) * 100) : average;
            return (
              <div key={menu.key} className="space-y-1">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_112px_36px] gap-2">
                  {isCustom ? (
                    <input
                      value={menu.name}
                      aria-label={`새 메뉴 ${index + 1}`}
                      placeholder="메뉴 이름"
                      onChange={(event) => {
                        const menus = draft.menus.map((item) =>
                          item.key === menu.key ? { ...item, name: event.target.value, custom: true } : item,
                        );
                        patch({ menus });
                      }}
                      className={fieldClass}
                    />
                  ) : (
                    <select
                      value={menu.name}
                      aria-label={`메뉴 ${index + 1}`}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === CUSTOM_MENU) {
                          const menus = draft.menus.map((item) =>
                            item.key === menu.key
                              ? {
                                  ...item,
                                  name: "",
                                  grams: item.grams || "100",
                                  price: item.price,
                                  custom: true,
                                  key: crypto.randomUUID(),
                                }
                              : item,
                          );
                          patch({ menus });
                          return;
                        }
                        const selected = menuOptions.find((option) => option.name === value);
                        const menus = draft.menus.map((item) =>
                          item.key === menu.key
                            ? {
                                ...item,
                                name: value,
                                custom: false,
                                key: selected?.id ?? item.key,
                              }
                            : item,
                        );
                        patch({ menus });
                      }}
                      className={fieldClass}
                    >
                      <option value="">메뉴 선택</option>
                      {optionsForRow(menu.name).map((option) => (
                        <option key={option.id} value={option.name}>
                          {menuLabel(option.name)}
                        </option>
                      ))}
                      <option value={CUSTOM_MENU}>새 메뉴 추가</option>
                    </select>
                  )}
                  <input
                    inputMode="numeric"
                    value={menu.grams}
                    aria-label={`${menu.name || "메뉴"} 그람수`}
                    placeholder="100"
                    onChange={(event) => {
                      const menus = draft.menus.map((item) =>
                        item.key === menu.key ? { ...item, grams: event.target.value } : item,
                      );
                      patch({ menus });
                    }}
                    className={fieldClass}
                  />
                  <input
                    inputMode="numeric"
                    value={menu.price}
                    aria-label={`${menu.name || "메뉴"} 총 가격`}
                    placeholder={average ? String(average) : "0"}
                    onChange={(event) => {
                      const menus = draft.menus.map((item) =>
                        item.key === menu.key ? { ...item, price: event.target.value } : item,
                      );
                      patch({ menus });
                    }}
                    className={`${fieldClass} bg-[#fff3b0]`}
                  />
                  <button
                    type="button"
                    aria-label="메뉴 삭제"
                    onClick={() => {
                      const next = draft.menus.filter((item) => item.key !== menu.key);
                      patch({ menus: next.length > 0 ? next : [emptyMenuRow()] });
                    }}
                    className="rounded-lg border border-[#e4d8c6] text-stone-500"
                  >
                    ×
                  </button>
                </div>
                {unitPreview ? (
                  <p className="text-xs text-stone-500">
                    100g당 약 {unitPreview.toLocaleString("ko-KR")}원
                  </p>
                ) : null}
                {isCustom ? (
                  <button
                    type="button"
                    onClick={() => {
                      const menus = draft.menus.map((item) =>
                        item.key === menu.key ? { ...item, name: "", custom: false } : item,
                      );
                      patch({ menus });
                    }}
                    className="text-xs text-stone-500 underline-offset-2 hover:underline"
                  >
                    목록에서 고르기
                  </button>
                ) : null}
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            {unusedMenus.length > 0 ? (
              <button
                type="button"
                onClick={() => patch({ menus: [...draft.menus, emptyMenuRow()] })}
                className="grid h-10 w-10 place-items-center rounded-lg border border-[#e4d8c6] text-xl"
              >
                <span className="sr-only">메뉴 행 추가</span>+
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => patch({ menus: [...draft.menus, emptyMenuRow(true)] })}
              className="h-10 rounded-lg border border-dashed border-[#c9b79d] px-3 text-sm font-medium text-stone-600 hover:border-[#c4492c] hover:text-[#c4492c]"
            >
              새 메뉴 추가
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-[#e4d8c6] p-3">
          <div>
            <span className="mb-1 block text-xs font-bold text-stone-500">분야</span>
            <p className="rounded-lg border border-[#efe4d4] bg-[#faf6ef] px-3 py-2 text-sm font-medium text-[#241c17]">
              {draft.category}
            </p>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold text-stone-500">날짜</span>
            <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
              <input
                type="date"
                aria-label="날짜"
                value={draft.date}
                onChange={(event) => patch({ date: event.target.value })}
                className={fieldClass}
              />
              <select
                aria-label="시간"
                value={draft.purchaseHour}
                onChange={(event) => patch({ purchaseHour: event.target.value })}
                className={fieldClass}
              >
                <option value="">선택</option>
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={String(hour)}>
                    {hour}시
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
        </>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-sm font-bold">{mode === "prose" ? "줄글 데이터 테이블" : "직접 입력 데이터 테이블"}</h3>
          <WikiTable store={preview} source={mode === "prose" ? "prose" : "fields"} />
          <p className="text-xs text-stone-500">
            {mode === "prose"
              ? "줄글로 올린 후기입니다. 정리된 가격은 가게 화면 평균에 반영됩니다."
              : "직접 입력한 메뉴·가격입니다. 평균은 가게 화면에 반영됩니다."}
          </p>
        </section>

        <button
          type="submit"
          disabled={busy || (mode === "prose" && !draft.text.trim())}
          className={`h-11 w-full rounded-lg text-sm font-semibold text-white disabled:bg-[#efe4d4] disabled:text-stone-400 ${
            mode === "prose" ? "bg-[#1f7a45] hover:bg-[#18663a]" : "bg-[#c4492c] hover:bg-[#a63b24]"
          }`}
        >
          {mode === "prose" ? "등록하고 AI로 정리" : "등록"}
        </button>
      </div>
    </form>
  );
}
