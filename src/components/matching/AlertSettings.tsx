"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useMatchingStore } from "@/lib/matching-store";
import type { CategoryId } from "@/lib/types";

interface AlertSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function AlertSettings({ open, onClose }: AlertSettingsProps) {
  const {
    alerts,
    alertCount,
    toggleAlertCategory,
    addAlertKeyword,
    removeAlertKeyword,
  } = useMatchingStore();
  const [keyword, setKeyword] = useState("");

  if (!open) return null;

  const handleAddKeyword = (event: FormEvent) => {
    event.preventDefault();
    addAlertKeyword(keyword);
    setKeyword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-hanok-darkest/45 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />
      <section className="fade-up relative flex max-h-[min(88dvh,820px)] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[1.8rem] border border-hanji-soft bg-hanji-main shadow-2xl sm:max-h-[min(88dvh,780px)] sm:rounded-[1.8rem]">
        <header className="flex items-start justify-between gap-3 border-b border-hanji-soft px-5 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
              반띵 알림
            </h2>
            <p className="mt-1 break-keep text-sm leading-relaxed text-hanok-bright">
              관심 카테고리·검색어가 올라오면
              <br />
              푸시로 알려 드려요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hanji-soft text-hanok-dark"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/80 px-4 py-3 text-xs leading-relaxed break-keep text-hanok-deep">
            로그인 후 이용할 수 있는 설정입니다.
            <br />
            지금은 데모로 바로 저장되며,
            <br />
            실제 푸시는 이후 알림 서버와 연결됩니다.
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-ink">카테고리 알림</h3>
              <span className="text-xs text-hanok-bright">
                {alerts.categories.length}개 켜짐
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.filter((item) => item.id !== "all").map((category) => {
                const id = category.id as Exclude<CategoryId, "all">;
                const active = alerts.categories.includes(id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleAlertCategory(id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-hanok-main bg-hanok-light/35"
                        : "border-hanji-soft bg-hanji-warm"
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <p className="mt-1 text-sm font-semibold text-hanok-dark">
                      {category.label}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-hanok-bright">
                      {active ? "알림 켜짐" : "알림 꺼짐"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-ink">검색어 알림</h3>
              <span className="text-xs text-hanok-bright">
                {alerts.keywords.length}개
              </span>
            </div>
            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="예: 감귤, 김치, 호떡"
                className="flex-1 rounded-2xl border border-hanji-fiber bg-hanji-warm px-4 py-3 outline-none ring-hanok-main focus:ring-2"
              />
              <button
                type="submit"
                className="rounded-2xl bg-hanok-main px-4 py-3 font-bold text-hanji-main"
              >
                추가
              </button>
            </form>
            {alerts.keywords.length === 0 ? (
              <p className="mt-3 text-sm text-hanok-bright">
                자주 찾는 품목 이름을 등록해 보세요.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {alerts.keywords.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeAlertKeyword(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-hanok-darkest px-3 py-1.5 text-sm text-hanji-main"
                  >
                    {item}
                    <span aria-hidden>✕</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <p className="text-center text-xs text-hanok-bright">
            현재 구독 {alertCount}건
          </p>
        </div>
      </section>
    </div>
  );
}
