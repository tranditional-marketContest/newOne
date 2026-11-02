"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useMatchingStore } from "@/lib/matching-store";
import type { CategoryId } from "@/lib/types";

interface AlertSettingsProps {
  open: boolean;
  onClose: () => void;
}

type AlertTab = "inbox" | "settings";

function formatPushTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function AlertSettings({ open, onClose }: AlertSettingsProps) {
  const {
    alerts,
    alertCount,
    pushNotifications,
    unreadPushCount,
    toggleAlertCategory,
    addAlertKeyword,
    removeAlertKeyword,
    markPushRead,
    markAllPushRead,
  } = useMatchingStore();
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<AlertTab>("inbox");

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
        <header className="border-b border-hanji-soft px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                반띵 알림
              </h2>
              <p className="mt-1 break-keep text-sm leading-relaxed text-hanok-bright">
                알림 내역과 관심 설정을
                <br />
                한곳에서 관리해요.
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
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-hanji-warm p-1">
            <button
              type="button"
              onClick={() => setTab("inbox")}
              className={`rounded-xl py-2 text-sm font-bold transition ${
                tab === "inbox"
                  ? "bg-hanok-main text-hanji-main"
                  : "text-hanok-bright"
              }`}
            >
              알림 내역
              {unreadPushCount > 0 ? ` · ${unreadPushCount}` : ""}
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`rounded-xl py-2 text-sm font-bold transition ${
                tab === "settings"
                  ? "bg-hanok-main text-hanji-main"
                  : "text-hanok-bright"
              }`}
            >
              알림 설정
            </button>
          </div>
        </header>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          {tab === "inbox" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="break-keep text-xs leading-relaxed text-hanok-bright">
                  구독한 카테고리·검색어에 맞는
                  <br />
                  다른 이웃의 글만 모아 보여 줍니다.
                </p>
                {unreadPushCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllPushRead}
                    className="shrink-0 rounded-full bg-hanji-soft px-3 py-1.5 text-xs font-bold text-hanok-dark"
                  >
                    모두 읽음
                  </button>
                ) : null}
              </div>

              {pushNotifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/70 px-4 py-8 text-center">
                  <p className="font-bold text-hanok-dark">아직 알림 내역이 없어요</p>
                  <p className="mt-2 break-keep text-sm text-hanok-bright">
                    알림 설정에서 관심 카테고리나
                    <br />
                    검색어를 켜 두면 여기에 쌓입니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pushNotifications.map((item) => (
                    <Link
                      key={item.id}
                      href={`/matching/${item.postId}`}
                      onClick={() => {
                        markPushRead(item.id);
                        onClose();
                      }}
                      className={`block rounded-2xl border px-4 py-3 transition ${
                        item.read
                          ? "border-hanji-soft bg-hanji-main"
                          : "border-hanok-light bg-[#fff8ea]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-keep text-sm font-bold text-ink">
                          {!item.read ? (
                            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger align-middle" />
                          ) : null}
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[0.65rem] text-hanok-bright">
                          {formatPushTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 break-keep text-xs text-hanok-main">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[0.7rem] font-medium text-hanok-bright">
                        {item.reason}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/80 px-4 py-3 text-xs leading-relaxed break-keep text-hanok-deep">
                로그인 후 이용할 수 있는 설정입니다.
                <br />
                지금은 데모로 바로 저장되며,
                <br />
                실제 푸시는 이후 알림 서버와 연결됩니다.
                <br />
                내가 올린 글은 알림 대상에서 제외됩니다.
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
                  <p className="mt-3 break-keep text-sm text-hanok-bright">
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
