"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginCallout } from "@/components/matching/LoginCallout";
import { CATEGORIES, CATEGORY_EMOJI } from "@/lib/matching/categories";
import {
  formatPrice,
  placeLabel,
  pricePerPerson,
  useMatchingStore,
} from "@/lib/matching/store";
import { draftFromPost } from "@/lib/matching/post-draft";
import {
  DEADLINE_LABELS,
  MEETING_PLACE_LABELS,
  type CategoryId,
  type CreateDraft,
  type DeadlineOption,
  type MatchingPost,
  type MeetingPlace,
} from "@/lib/matching/types";

const STEPS = ["품목", "가게·메뉴", "가격·인원", "마감·장소"] as const;

const EMPTY_DRAFT: CreateDraft = {
  category: null,
  itemName: "",
  storeName: "",
  menuName: "",
  totalPrice: 20000,
  peopleNeeded: 2,
  deadline: "2h",
  meetingPlace: "main-gate",
  customPlace: "",
  note: "",
};

interface CreateWizardProps {
  open: boolean;
  onClose: () => void;
  editPost?: MatchingPost | null;
}

export function CreateWizard({ open, onClose, editPost = null }: CreateWizardProps) {
  const router = useRouter();
  const { createPost, updatePost, viewer } = useMatchingStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CreateDraft>(EMPTY_DRAFT);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(editPost);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDraft(editPost ? draftFromPost(editPost) : EMPTY_DRAFT);
  }, [open, editPost]);

  const perPerson = pricePerPerson(draft.totalPrice, draft.peopleNeeded);
  const canNext = useMemo(() => {
    if (step === 0) return Boolean(draft.category);
    if (step === 1) return Boolean(draft.menuName.trim());
    if (step === 2) return draft.totalPrice > 0 && draft.peopleNeeded >= 2;
    if (step === 3) {
      if (draft.meetingPlace === "custom") return Boolean(draft.customPlace.trim());
      return true;
    }
    return false;
  }, [draft, step]);

  if (!open) return null;

  const update = <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setStep(0);
    setDraft(EMPTY_DRAFT);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const payload = { ...draft, itemName: draft.menuName.trim() };
    try {
      if (isEditing && editPost) {
        await updatePost(editPost.id, payload);
        handleClose();
        return;
      }
      const post = await createPost(payload);
      handleClose();
      router.push(`/matching/${post.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-hanok-darkest/45 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={handleClose}
      />
      <section className="fade-up relative flex max-h-[min(92dvh,820px)] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[1.8rem] border border-hanji-soft bg-hanji-main shadow-2xl sm:max-h-[min(92dvh,780px)] sm:rounded-[1.8rem]">
        <header className="flex items-center justify-between border-b border-hanji-soft px-5 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
            {isEditing ? (
              "반띵 글 수정"
            ) : (
              <>
                반
                <span className="mx-0.5 inline-block h-4 w-[2px] bg-hanji-main align-middle" />
                띵 글 올리기
              </>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-hanji-soft text-hanok-dark"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        {viewer ? (
        <div className="px-5 pt-4">
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li key={label} className="text-center">
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      done || current
                        ? "bg-hanok-main text-hanji-main"
                        : "bg-hanji-soft text-hanok-bright"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>
                  <p
                    className={`mt-1 text-[0.68rem] ${
                      current ? "font-bold text-hanok-dark" : "text-hanok-bright"
                    }`}
                  >
                    {label}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {viewer ? null : (
            <LoginCallout title="로그인하면 반띵 글을 올릴 수 있어요" />
          )}
          {viewer && step === 0 ? (
            <StepItem draft={draft} update={update} />
          ) : null}
          {viewer && step === 1 ? (
            <StepStore draft={draft} update={update} />
          ) : null}
          {viewer && step === 2 ? (
            <StepPeople draft={draft} update={update} perPerson={perPerson} />
          ) : null}
          {viewer && step === 3 ? (
            <StepDeadline draft={draft} update={update} perPerson={perPerson} />
          ) : null}
        </div>

        {viewer ? (
        <footer className="border-t border-hanji-soft p-4">
          {submitError ? (
            <p className="mb-2 text-center text-sm text-danger">{submitError}</p>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((prev) => prev + 1)}
              className="w-full rounded-2xl bg-hanok-main py-3.5 text-base font-bold text-hanji-main transition enabled:hover:bg-hanok-deep disabled:cursor-not-allowed disabled:bg-hanji-fiber disabled:text-hanok-bright"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext}
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-hanok-dark py-3.5 text-base font-bold text-hanji-main transition enabled:hover:bg-hanok-darkest disabled:cursor-not-allowed disabled:bg-hanji-fiber disabled:text-hanok-bright"
            >
              {isEditing ? "수정 저장" : "반띵 글 올리기"}
            </button>
          )}
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="mt-2 w-full py-2 text-sm text-hanok-main"
            >
              이전 단계
            </button>
          ) : null}
        </footer>
        ) : null}
      </section>
    </div>
  );
}

function StepItem({
  draft,
  update,
}: {
  draft: CreateDraft;
  update: <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-ink">어떤 품목을 반띵할까요?</h3>
        <p className="mt-1 text-sm text-hanok-bright">카테고리를 골라 주세요.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.filter((item) => item.id !== "all").map((category) => {
          const id = category.id as Exclude<CategoryId, "all">;
          const active = draft.category === id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => update("category", id)}
              className={`rounded-2xl border px-3 py-4 text-left transition ${
                active
                  ? "border-hanok-main bg-hanok-light/35"
                  : "border-hanji-soft bg-hanji-warm"
              }`}
            >
              <span className="text-2xl">{category.icon}</span>
              <p className="mt-2 font-semibold text-hanok-dark">{category.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepStore({
  draft,
  update,
}: {
  draft: CreateDraft;
  update: <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-ink">어느 가게에서 살까요?</h3>
        <p className="mt-1 text-sm text-hanok-bright">상품을 적어 주세요. 가게 이름은 비워도 됩니다.</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-hanok-deep">가게 이름 (선택)</span>
        <input
          value={draft.storeName}
          onChange={(event) => update("storeName", event.target.value)}
          placeholder="예: 청과 한마당"
          className="w-full rounded-2xl border border-hanji-fiber bg-hanji-main px-4 py-3 outline-none ring-hanok-main focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-hanok-deep">메뉴 / 상품</span>
        <input
          value={draft.menuName}
          onChange={(event) => update("menuName", event.target.value)}
          placeholder="예: 부사 사과 10입"
          className="w-full rounded-2xl border border-hanji-fiber bg-hanji-main px-4 py-3 outline-none ring-hanok-main focus:ring-2"
        />
      </label>
    </div>
  );
}

function StepPeople({
  draft,
  update,
  perPerson,
}: {
  draft: CreateDraft;
  update: <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => void;
  perPerson: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-ink">몇 명이서 나눌까요?</h3>
        <p className="mt-1 text-sm text-hanok-bright">
          {draft.menuName.trim() || "선택 상품"} · {formatPrice(draft.totalPrice)}
        </p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-hanok-deep">총 가격</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={draft.totalPrice === 0 ? "" : String(draft.totalPrice)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            update("totalPrice", digits === "" ? 0 : Number(digits));
          }}
          className="w-full rounded-2xl border border-hanji-fiber bg-hanji-main px-4 py-3 outline-none ring-hanok-main focus:ring-2"
        />
      </label>
      <div className="grid grid-cols-4 gap-2">
        {[2, 3, 4, 5].map((count) => {
          const active = draft.peopleNeeded === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => update("peopleNeeded", count)}
              className={`rounded-2xl border px-2 py-3 ${
                active
                  ? "border-hanok-dark bg-hanok-main text-hanji-main"
                  : "border-hanji-soft bg-hanji-warm text-hanok-dark"
              }`}
            >
              <p className="font-bold">{count}명</p>
              <div className="mt-2 flex justify-center gap-1">
                {Array.from({ length: count }).map((_, index) => (
                  <span
                    key={`${count}-${index}`}
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-hanji-main" : "bg-hanok-light"
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-hanok-darkest px-4 py-4 text-hanji-main">
        <p className="text-sm text-hanji-soft">
          {formatPrice(draft.totalPrice)} ÷ {draft.peopleNeeded}명 · 내 몫 포함
        </p>
        <p className="text-lg font-bold text-hanji-main">1인 {formatPrice(perPerson)}</p>
      </div>
    </div>
  );
}

function StepDeadline({
  draft,
  update,
  perPerson,
}: {
  draft: CreateDraft;
  update: <K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) => void;
  perPerson: number;
}) {
  const emoji = draft.category ? CATEGORY_EMOJI[draft.category] : "🛒";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-ink">언제까지 모집할까요?</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DEADLINE_LABELS) as DeadlineOption[]).map((option) => {
          const active = draft.deadline === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => update("deadline", option)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                active
                  ? "bg-hanok-main text-hanji-main"
                  : "bg-hanji-soft text-hanok-dark"
              }`}
            >
              {DEADLINE_LABELS[option]}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-bold text-ink">어디서 만날까요?</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MEETING_PLACE_LABELS) as MeetingPlace[]).map((option) => {
          const active = draft.meetingPlace === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => update("meetingPlace", option)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                active
                  ? "bg-hanok-main text-hanji-main"
                  : "bg-hanji-soft text-hanok-dark"
              }`}
            >
              {MEETING_PLACE_LABELS[option]}
            </button>
          );
        })}
      </div>
      {draft.meetingPlace === "custom" ? (
        <input
          value={draft.customPlace}
          onChange={(event) => update("customPlace", event.target.value)}
          placeholder="만날 장소를 적어 주세요"
          className="w-full rounded-2xl border border-hanji-fiber bg-hanji-main px-4 py-3 outline-none ring-hanok-main focus:ring-2"
        />
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-hanok-deep">한마디 (선택)</span>
        <input
          value={draft.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="예: 7시 이후 수령 가능해요"
          className="w-full rounded-2xl border border-hanok-light bg-hanji-main px-4 py-3 outline-none ring-hanok-main focus:ring-2"
        />
      </label>

      <div className="rounded-2xl border border-dashed border-hanok-light bg-hanji-warm/70 p-3">
        <p className="mb-2 text-xs font-medium text-hanok-bright">미리보기</p>
        <div className="flex gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-hanji-soft text-2xl">
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">
              {draft.menuName.trim() || "상품"} {draft.peopleNeeded}명이서 나눠요
            </p>
            <p className="text-sm font-semibold text-hanok-deep">
              {formatPrice(perPerson)} / 1인
            </p>
            <p className="truncate text-xs text-hanok-main">
              {[
                draft.storeName.trim(),
                placeLabel(draft.meetingPlace, draft.customPlace),
                `${DEADLINE_LABELS[draft.deadline]} 모집`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
