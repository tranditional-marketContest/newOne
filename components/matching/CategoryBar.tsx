"use client";

import { useEffect, useRef } from "react";
import { CATEGORIES } from "@/lib/matching/categories";
import type { CategoryId } from "@/lib/matching/types";

interface CategoryBarProps {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
  counts?: Partial<Record<CategoryId, number>>;
}

export function CategoryBar({ value, onChange, counts }: CategoryBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const scale = el.getBoundingClientRect().width / el.clientWidth || 1;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      el.scrollLeft += delta / scale;
      event.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="min-w-0 w-full overflow-hidden border-b border-hanji-soft bg-hanji-warm/80 py-3">
      <div
        ref={scrollerRef}
        className="category-scroll flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-3 pb-2 touch-pan-x"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const el = event.currentTarget;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScroll: el.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (drag.pointerId !== event.pointerId) return;
          const el = event.currentTarget;
          const scale = el.getBoundingClientRect().width / el.clientWidth || 1;
          const dx = (event.clientX - drag.startX) / scale;
          if (!drag.moved) {
            if (Math.abs(dx) < 8) return;
            drag.moved = true;
            el.setPointerCapture(event.pointerId);
          }
          el.scrollLeft = drag.startScroll - dx;
        }}
        onPointerUp={(event) => {
          if (dragRef.current.pointerId !== event.pointerId) return;
          dragRef.current.pointerId = -1;
        }}
        onPointerCancel={() => {
          dragRef.current.pointerId = -1;
        }}
        onClickCapture={(event) => {
          if (!dragRef.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          dragRef.current.moved = false;
        }}
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
                  ? "bg-hanok-main text-hanji-main shadow-[0_6px_14px_rgba(155,35,53,0.28)]"
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
