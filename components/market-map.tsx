"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  type CategoryFilter,
  type Store,
  stallTone,
  storesIn,
} from "@/data/market";

type Props = {
  category: CategoryFilter;
  onCategory: (category: CategoryFilter) => void;
  brief: Store | null;
  onBrief: (id: string | null) => void;
  onOpenDetail: (id: string) => void;
};

type PopoverPos = { x: number; y: number };

export function MarketMap({ category, onCategory, brief, onBrief, onOpenDetail }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pending = useRef<{ id: string; at: number } | null>(null);
  const [popover, setPopover] = useState<PopoverPos | null>(null);
  const visible = storesIn(category);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!brief || !svg || !wrap) {
      setPopover(null);
      return;
    }

    function place() {
      const currentSvg = svgRef.current;
      const currentWrap = wrapRef.current;
      if (!brief || !currentSvg || !currentWrap) return;
      const point = currentSvg.createSVGPoint();
      point.x = brief.x;
      point.y = brief.y;
      const matrix = currentSvg.getScreenCTM();
      if (!matrix) return;
      const projected = point.matrixTransform(matrix);
      const box = currentWrap.getBoundingClientRect();
      const scaleX = box.width / currentWrap.clientWidth || 1;
      const scaleY = box.height / currentWrap.clientHeight || 1;
      setPopover({
        x: (projected.x - box.left) / scaleX,
        y: (projected.y - box.top) / scaleY,
      });
    }

    place();
    const observer = new ResizeObserver(place);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [brief]);

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

  const wrapWidth = wrapRef.current?.clientWidth ?? 0;
  const wrapHeight = wrapRef.current?.clientHeight ?? 0;
  const placeLeft = popover ? popover.x > wrapWidth * 0.62 : false;
  const placeAbove = popover ? popover.y > wrapHeight * 0.58 : false;

  return (
    <div
      ref={wrapRef}
      className="relative h-full min-h-0 touch-manipulation bg-[#f3e6d4]"
      role="region"
      aria-label="신원시장 지도"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 120"
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F6EBDD" />
            <stop offset="100%" stopColor="#E7D5C0" />
          </linearGradient>
          <pattern id="grain" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <circle cx="0.4" cy="0.5" r="0.18" fill="#D9C6AE" opacity="0.45" />
          </pattern>
          <linearGradient id="stream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#24324A" />
            <stop offset="100%" stopColor="#3E5378" />
          </linearGradient>
        </defs>

        <rect
          width="100"
          height="120"
          fill="url(#ground)"
          className="pointer-events-auto cursor-default"
          onClick={() => {
            pending.current = null;
            onBrief(null);
          }}
        />
        <rect width="100" height="120" fill="url(#grain)" />

        <rect width="100" height="8" fill="url(#stream)" />
        <text
          x="58"
          y="5.2"
          textAnchor="middle"
          fill="#F6E7B4"
          fontSize="2.7"
          className="font-display"
        >
          도림천
        </text>

        <rect x="0" y="8" width="14" height="112" fill="#E7D4BE" />
        <rect x="86" y="8" width="14" height="112" fill="#E7D4BE" />
        {[22, 40, 58, 76, 94, 110].map((y) => (
          <g key={y}>
            <line x1="0" y1={y} x2="14" y2={y} stroke="#D9C3A8" strokeWidth="0.35" />
            <line x1="86" y1={y} x2="100" y2={y} stroke="#D9C3A8" strokeWidth="0.35" />
          </g>
        ))}

        <rect x="34" y="14" width="36" height="96" rx="3" fill="#FBF6EE" />
        <rect x="12" y="56" width="76" height="8" rx="2.2" fill="#FBF6EE" />
        <line
          x1="52"
          y1="16"
          x2="52"
          y2="108"
          stroke="#E4D3C0"
          strokeWidth="0.35"
          strokeDasharray="1.2 1.4"
        />

        {visible.map((store) => {
          const tone = stallTone[store.category];
          const w = 13;
          const h = 7.2;
          const left = store.x - w / 2;
          const top = store.y - h / 2;
          return (
            <g key={store.id}>
              <rect
                x={left + 0.35}
                y={top + 0.45}
                width={w}
                height={h}
                rx="1.15"
                fill="#2A2118"
                opacity="0.08"
              />
              <rect x={left} y={top} width={w} height={h} rx="1.15" fill={tone.fill} />
              <path
                d={`M ${left + 0.2} ${top + 2.2} H ${left + w - 0.2} V ${top + 1.15} Q ${left + w - 0.2} ${top} ${left + w - 1.3} ${top} H ${left + 1.3} Q ${left + 0.2} ${top} ${left + 0.2} ${top + 1.15} Z`}
                fill={tone.shade}
              />
            </g>
          );
        })}

        <path d="M44 112 Q52 106 60 112" fill="none" stroke="#9B2335" strokeWidth="0.55" />
        <text x="52" y="116.4" textAnchor="middle" fill="#8A7060" fontSize="2.6" className="font-display">
          정문
        </text>

        {visible.map((store) => {
          const selected = brief?.id === store.id;
          return (
            <g
              key={`dot-${store.id}`}
              className="store-dot pointer-events-auto cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${store.name}, ${store.category}. 한 번 누르면 요약, 두 번 누르면 상세 정보`}
              onClick={(event) => {
                event.stopPropagation();
                handleMarkerClick(store.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleMarkerClick(store.id);
                }
              }}
            >
              <circle cx={store.x} cy={store.y} r="7" fill="transparent" pointerEvents="all" />
              <circle cx={store.x} cy={store.y} r={selected ? 2.45 : 1.95} fill="#FFFBF6" />
              <circle className="core" cx={store.x} cy={store.y} r={selected ? 1.45 : 1.15} fill="#E23B2F" />
              <circle
                className="halo"
                cx={store.x}
                cy={store.y}
                r={selected ? 3.2 : 2.55}
                fill="none"
                stroke="#E23B2F"
                strokeOpacity={selected ? 0.55 : 0.38}
                strokeWidth={selected ? 0.7 : 0.45}
              />
            </g>
          );
        })}
      </svg>

      <div className="absolute top-3 left-2.5 z-20 flex flex-col gap-1">
        {CATEGORIES.map((item) => {
          const active = item === category;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onCategory(item)}
              className={`rounded-xl px-2.5 py-1.5 text-left text-[12px] leading-none font-medium shadow-sm transition active:scale-95 ${
                active
                  ? "bg-[#9b2335] text-white"
                  : "bg-white/92 text-[#2a2118] ring-1 ring-[#2a2118]/10 hover:bg-white"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="absolute top-3 right-2.5 z-20 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-[#6d5c4e] shadow-sm ring-1 ring-[#2a2118]/10">
        {category} {visible.length}곳
      </div>

      {visible.length === 0 ? (
        <p className="absolute inset-x-16 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-white/95 px-4 py-3 text-center text-sm leading-6 text-[#5c5146] shadow-sm ring-1 ring-[#2a2118]/10">
          이 분류에 등록된 가게가 아직 없습니다.
        </p>
      ) : null}

      {brief && popover ? (
        <div
          role="status"
          className="sheet-rise absolute z-30 w-[12.4rem] rounded-2xl bg-white/96 p-3 shadow-[0_16px_40px_rgba(42,33,24,0.18)] ring-1 ring-[#2a2118]/10 backdrop-blur-sm"
          style={{
            left: placeLeft ? undefined : popover.x + 16,
            right: placeLeft ? wrapWidth - popover.x + 16 : undefined,
            top: placeAbove ? undefined : popover.y + 14,
            bottom: placeAbove ? wrapHeight - popover.y + 14 : undefined,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-[10px] font-semibold tracking-wide text-[#9b2335]">{brief.category}</p>
          <p className="font-display mt-0.5 text-[17px] leading-6 text-[#2a2118]">{brief.name}</p>
          <p className="mt-1 text-xs leading-5 text-[#5c5146]">{brief.summary}</p>
          <p className="mt-1.5 text-[10px] text-[#8a7b6c]">{brief.place}</p>
          <button
            type="button"
            onClick={() => onOpenDetail(brief.id)}
            className="mt-2 text-xs font-semibold text-[#9b2335]"
          >
            가게 정보 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
