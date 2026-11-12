"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CategoryIcon } from "@/app/course/category-icon";
import { CloseIcon } from "@/components/icons";
import { MapScrollBar } from "@/components/map-scrollbar";
import { storesIn, storeSummary, type Store } from "@/data/market";
import { shops } from "@/lib/course";

type Props = {
  stores: Store[];
  categories: string[];
  category: string;
  onCategory: (category: string) => void;
  brief: Store | null;
  onBrief: (id: string | null) => void;
  onOpenDetail: (id: string) => void;
  onDelete?: (store: Store) => void;
  placeMode?: boolean;
  pendingPin?: { x: number; y: number } | null;
  onPlacePin?: (pin: { x: number; y: number }) => void;
  dockBottom?: string;
};

const CROP_TOP = (58 / 430) * 100;
const CROP_BOTTOM = (291 / 430) * 100;
const MAP_RATIO = 1024 / 233;
const MAX_SCALE = 4;

const iconByName = new Map(shops.filter((item) => item.kind !== "place").map((item) => [item.name, item.category]));
const greenPins = shops.filter((item) => item.kind === "place");

function toVertical(item: { x: number; y: number }) {
  return { x: ((CROP_BOTTOM - item.y) / (CROP_BOTTOM - CROP_TOP)) * 100, y: item.x };
}

function clampAxis(offset: number, view: number, size: number) {
  if (size <= view) return (view - size) / 2;
  return Math.min(0, Math.max(view - size, offset));
}

function fromVertical(turned: { x: number; y: number }) {
  const span = CROP_BOTTOM - CROP_TOP;
  return {
    x: Math.round(turned.y * 10) / 10,
    y: Math.round((CROP_BOTTOM - (turned.x / 100) * span) * 10) / 10,
  };
}

function point(item: { x: number; y: number }) {
  const turned = toVertical(item);
  return {
    left: `clamp(14px, ${turned.x}%, calc(100% - 14px))`,
    top: `clamp(14px, ${turned.y}%, calc(100% - 14px))`,
  };
}

export function BlockMarketMap({
  stores,
  categories,
  category,
  onCategory,
  brief,
  onBrief,
  onOpenDetail,
  onDelete,
  placeMode = false,
  pendingPin = null,
  onPlacePin,
  dockBottom = "12px",
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ id: string; at: number } | null>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(
    null,
  );
  const visible = storesIn(stores, category);
  const minScale = view.width > 0 ? Math.min(1, view.height / (view.width * MAP_RATIO)) : 1;

  const clampOffset = useCallback(
    (next: { x: number; y: number }, nextScale: number) => ({
      x: clampAxis(next.x, view.width, view.width * nextScale),
      y: clampAxis(next.y, view.height, view.width * MAP_RATIO * nextScale),
    }),
    [view],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      const next = Math.min(MAX_SCALE, Math.max(minScale, scale * factor));
      const ratio = next / scale;
      setScale(next);
      setOffset((off) => clampOffset({ x: cx - (cx - off.x) * ratio, y: cy - (cy - off.y) * ratio }, next));
    },
    [clampOffset, minScale, scale],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setView({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOffset((off) => clampOffset(off, scale));
  }, [clampOffset, scale]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture can fail outside a real pointer gesture.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    setOffset(clampOffset({ x: drag.originX + dx, y: drag.originY + dy }, scale));
  }

  function pinFromClient(clientX: number, clientY: number) {
    const el = viewportRef.current;
    if (!el || view.width <= 0) return null;
    const rect = el.getBoundingClientRect();
    const css = rect.width / el.clientWidth || 1;
    const localX = (clientX - rect.left) / css;
    const localY = (clientY - rect.top) / css;
    const mapX = (localX - offset.x) / scale;
    const mapY = (localY - offset.y) / scale;
    const width = el.clientWidth;
    const height = width * MAP_RATIO;
    if (mapX < 0 || mapY < 0 || mapX > width || mapY > height) return null;
    return fromVertical({ x: (mapX / width) * 100, y: (mapY / height) * 100 });
  }

  function handleMarkerClick(id: string) {
    const now = performance.now();
    if (pending.current && pending.current.id === id && now - pending.current.at < 600) {
      pending.current = null;
      onOpenDetail(id);
      return;
    }
    pending.current = { id, at: now };
    onBrief(id);
  }

  return (
    <div className="relative flex h-full min-h-0 bg-[#f7f6f3]" role="region" aria-label="신원시장 지도">
      <div className="relative min-w-0 flex-1">
      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          if (drag?.pointerId === event.pointerId && !drag.moved) {
            if (placeMode && onPlacePin) {
              const pin = pinFromClient(event.clientX, event.clientY);
              if (pin) onPlacePin(pin);
            } else {
              onBrief(null);
            }
          }
          if (drag?.pointerId === event.pointerId) dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <div
          className="absolute top-0 left-0 w-full origin-top-left will-change-transform"
          style={{
            aspectRatio: `1 / ${MAP_RATIO}`,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <img
            src="/block-map-vertical.jpg"
            alt="신원시장 지도"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          {greenPins.map((item) => (
            <span
              key={item.id}
              title={item.name}
              className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_0_0_3px_rgba(22,163,74,0.25)]"
              style={{ ...point(item), scale: 1 / scale }}
            >
              <CategoryIcon category="수변" className="size-4" />
            </span>
          ))}
          {pendingPin ? (
            <span
              className="pointer-events-none absolute z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9b2335] shadow-[0_0_0_4px_rgba(155,35,53,0.28)]"
              style={{ ...point(pendingPin), scale: 1 / scale }}
            />
          ) : null}
          {visible.map((item) => {
            const selected = brief?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.name}
                aria-label={`${item.name}, ${item.category}. 한 번 누르면 요약, 두 번 누르면 상세 정보`}
                className={`absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white ${
                  selected
                    ? "bg-[#9b2335] shadow-[0_0_0_4px_rgba(155,35,53,0.28)]"
                    : "bg-[#e23a2b] shadow-[0_0_0_3px_rgba(226,58,43,0.22)]"
                }`}
                style={{ ...point(item), scale: 1 / scale }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  handleMarkerClick(item.id);
                }}
              >
                <CategoryIcon category={iconByName.get(item.name) ?? item.category} className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute top-3 left-2.5 z-20 flex max-h-[70%] flex-col gap-1 overflow-y-auto">
        {categories.map((item) => {
          const active = item === category;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onCategory(item)}
              className={`rounded-xl px-2.5 py-1.5 text-left text-[12px] leading-none font-medium shadow-sm ${
                active ? "bg-[#9b2335] text-white" : "bg-white/92 text-[#2a2118] ring-1 ring-[#2a2118]/10"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 z-30 flex flex-col gap-2" style={{ bottom: dockBottom }}>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-xl bg-white/95 text-2xl font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
          aria-label="확대"
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-xl bg-white/95 text-2xl font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
          aria-label="축소"
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.25);
          }}
        >
          −
        </button>
      </div>

      {brief ? (
        <div
          className="absolute inset-x-3 z-30 rounded-2xl bg-white/96 p-3 pr-9 shadow-[0_16px_40px_rgba(42,33,24,0.18)] ring-1 ring-[#2a2118]/10"
          style={{ bottom: dockBottom }}
        >
          <button
            type="button"
            onClick={() => onBrief(null)}
            aria-label="가게 소개 닫기"
            className="absolute top-2 right-2 grid size-6 place-items-center text-[#8a7568]"
          >
            <CloseIcon className="size-3.5" />
          </button>
          <p className="text-[10px] font-semibold tracking-wide text-[#9b2335]">{brief.category}</p>
          <p className="font-display mt-0.5 text-[17px] leading-6 text-[#2a2118]">{brief.name}</p>
          <p className="mt-1 text-xs leading-5 text-[#5c5146]">{storeSummary(brief)}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => onOpenDetail(brief.id)} className="text-xs font-semibold text-[#9b2335]">
              가게 정보 보기
            </button>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(brief)}
                className="h-8 shrink-0 rounded-xl bg-[#f6e6e2] px-3 text-xs font-bold text-[#a6452f]"
              >
                삭제
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
      <MapScrollBar
        height={Math.max(view.height, view.width * MAP_RATIO * scale)}
        scrollTop={Math.max(0, -offset.y)}
        onScroll={(top) => setOffset((off) => clampOffset({ x: off.x, y: -top }, scale))}
      />
    </div>
  );
}
