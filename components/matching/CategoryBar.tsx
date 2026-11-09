"use client";

import { CATEGORIES } from "@/lib/matching/categories";
import type { CategoryId } from "@/lib/matching/types";

interface CategoryBarProps {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
  counts?: Partial<Record<CategoryId, number>>;
}

export function CategoryBar({ value, onChange, counts }: CategoryBarProps) {
  return (
    <div className="border-b border-hanji-soft bg-hanji-warm/80 py-3">
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-3 pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {CATEGORIES.map((category) => {
          const active = value === category.id;
          const count = counts?.[category.id];
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={`flex w-[4.6rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 transition ${
                active
                  ? "bg-hanok-main text-hanji-main shadow-[0_6px_14px_rgba(129,85,48,0.28)]"
                  : "bg-transparent text-hanok-dark"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
                  active
                    ? "bg-hanok-darkest/25"
                    : "border border-hanji-fiber bg-hanji-main"
                }`}
              >
                {category.icon}
              </span>
              <span className="whitespace-nowrap text-xs font-medium">
                {category.label}
              </span>
              {typeof count === "number" ? (
                <span
                  className={`text-[0.65rem] ${
                    active ? "text-hanji-soft" : "text-hanok-bright"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
