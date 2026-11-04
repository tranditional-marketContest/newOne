"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { Store } from "@/data/stores";

type PendingPin = { x: number; y: number };

type MarketMapProps = {
  stores: Store[];
  placeMode?: boolean;
  pendingPin?: PendingPin | null;
  onPlacePin?: (pin: PendingPin) => void;
  selectedId?: string | null;
  onSelectStore?: (id: string) => void;
  className?: string;
};

const MIN_SCALE = 1;
const MAX_SCALE = 3.2;

export function MarketMap({
  stores,
  placeMode = false,
  pendingPin = null,
  onPlacePin,
  selectedId = null,
  onSelectStore,
  className = "",
}: MarketMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const clampOffset = useCallback(
    (next: { x: number; y: number }, nextScale = scale) => {
      const el = viewportRef.current;
      if (!el) return next;
      const { width, height } = el.getBoundingClientRect();
      const maxX = ((nextScale - 1) * width) / 2 + 24;
      const maxY = ((nextScale - 1) * height) / 2 + 24;
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [scale],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = clientX - rect.left - rect.width / 2;
      const cy = clientY - rect.top - rect.height / 2;

      setScale((prev) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
        const ratio = next / prev;
        setOffset((off) =>
          clampOffset(
            {
              x: cx - (cx - off.x) * ratio,
              y: cy - (cy - off.y) * ratio,
            },
            next,
          ),
        );
        return next;
      });
    },
    [clampOffset],
  );

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAt(event.clientX, event.clientY, factor);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    setOffset(
      clampOffset({
        x: drag.originX + dx,
        y: drag.originY + dy,
      }),
    );
  }

  function clientToMapPercent(clientX: number, clientY: number) {
    const el = viewportRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const localX = clientX - rect.left - rect.width / 2;
    const localY = clientY - rect.top - rect.height / 2;
    const mapX = (localX - offset.x) / scale + rect.width / 2;
    const mapY = (localY - offset.y) / scale + rect.height / 2;
    return {
      x: Math.min(96, Math.max(4, (mapX / rect.width) * 100)),
      y: Math.min(96, Math.max(4, (mapY / rect.height) * 100)),
    };
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved;
    dragRef.current = null;

    if (moved || !placeMode || !onPlacePin) return;
    const pin = clientToMapPercent(event.clientX, event.clientY);
    if (pin) onPlacePin(pin);
  }

  useEffect(() => {
    setOffset((off) => clampOffset(off));
  }, [scale, clampOffset]);

  return (
    <div className={`relative overflow-hidden rounded-[22px] bg-[#b7c6a4] ${className}`}>
      <div
        ref={viewportRef}
        className={`relative aspect-[4/3] w-full touch-none select-none overflow-hidden ${
          placeMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
        }`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <MarketIllustration />
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${store.x}%`, top: `${store.y}%` }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectStore?.(store.id);
              }}
              aria-label={store.name}
            >
              <span
                className={`block size-3.5 rounded-full bg-[#e23a2b] shadow-[0_0_0_3px_rgba(226,58,43,0.22)] ${
                  selectedId === store.id
                    ? "ring-2 ring-[#234237] ring-offset-2 ring-offset-[#f4efe4]"
                    : ""
                }`}
              />
              <span className="pointer-events-none absolute top-[18px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1c1915]/88 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {store.name}
              </span>
            </button>
          ))}
          {pendingPin ? (
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
            >
              <span className="block size-4 animate-pulse rounded-full bg-[#e25b32] shadow-[0_0_0_4px_rgba(226,91,50,0.25)]" />
            </span>
          ) : null}
        </div>
      </div>

      <div className="absolute right-3 bottom-3 flex flex-col gap-2">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl bg-white/95 text-[20px] font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
          aria-label="확대"
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl bg-white/95 text-[20px] font-bold text-[#234237] shadow-[0_2px_10px_rgba(28,25,21,0.12)]"
          aria-label="축소"
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
          }}
        >
          −
        </button>
      </div>

      <p className="pointer-events-none absolute top-3 left-3 rounded-lg bg-white/85 px-2.5 py-1 text-[11px] font-medium text-[#4d463d]">
        드래그로 이동 · 휠/+−로 확대
      </p>
    </div>
  );
}

function MarketIllustration() {
  return (
    <svg
      viewBox="0 0 800 560"
      className="h-full w-full"
      role="img"
      aria-label="신원시장 대략 분포도"
    >
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8d5b5" />
          <stop offset="55%" stopColor="#b7c6a4" />
          <stop offset="100%" stopColor="#a8b894" />
        </linearGradient>
        <linearGradient id="riverDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b91a8" />
          <stop offset="45%" stopColor="#6fa3b8" />
          <stop offset="100%" stopColor="#4e7f96" />
        </linearGradient>
        <linearGradient id="asphalt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8f908c" />
          <stop offset="50%" stopColor="#7c7d79" />
          <stop offset="100%" stopColor="#6e6f6b" />
        </linearGradient>
        <linearGradient id="plaza" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8cbb6" />
          <stop offset="100%" stopColor="#c9baa2" />
        </linearGradient>
        <pattern id="pavement" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#d2c4ad" />
          <path d="M0 12h12M12 0v12" stroke="#c3b49b" strokeWidth="0.5" />
        </pattern>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="2" floodColor="#2a2a22" floodOpacity="0.22" />
        </filter>
        <filter id="roofShade" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0.8" dy="1.2" stdDeviation="1.1" floodColor="#1f1f1a" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* 주변 지형 */}
      <rect width="800" height="560" fill="url(#ground)" />
      <ellipse cx="90" cy="470" rx="120" ry="70" fill="#9fb38a" opacity="0.45" />
      <ellipse cx="720" cy="500" rx="140" ry="80" fill="#9fb38a" opacity="0.4" />
      <ellipse cx="650" cy="250" rx="90" ry="50" fill="#a7bc92" opacity="0.35" />

      {/* 별빛내린천 - 현실적인 하천 */}
      <path
        d="M-20 40 C110 18, 210 92, 330 62 C450 34, 560 98, 820 48 L820 138 C560 180, 450 118, 330 148 C210 176, 110 112, -20 142 Z"
        fill="#6e8f6a"
      />
      <path
        d="M-20 58 C110 34, 210 104, 330 76 C450 50, 560 112, 820 64 L820 126 C560 168, 450 108, 330 136 C210 162, 110 100, -20 128 Z"
        fill="url(#riverDeep)"
      />
      <path
        d="M40 82 C160 60, 250 110, 360 88 C480 64, 600 118, 760 84"
        fill="none"
        stroke="#b7d7e4"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M80 100 C200 78, 290 128, 400 104 C520 80, 640 132, 740 100"
        fill="none"
        stroke="#d7eaf1"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.28"
      />
      <text x="24" y="42" fill="#2f4d42" fontSize="15" fontWeight="700" opacity="0.85">
        별빛내린천
      </text>

      {/* 수변 녹지·산책로 */}
      <path
        d="M-10 130 C120 104, 220 164, 340 138 C470 110, 580 170, 810 132 L810 176 C580 208, 470 152, 340 176 C220 200, 120 148, -10 172 Z"
        fill="#7f9b6d"
      />
      <path
        d="M20 148 C140 126, 240 172, 360 150 C480 128, 600 174, 780 148"
        fill="none"
        stroke="#e6dfd2"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      />
      <text x="24" y="168" fill="#30462c" fontSize="12" fontWeight="600" opacity="0.8">
        수변테라스 · 산책로
      </text>

      {/* 주변 도로 */}
      <path
        d="M0 198 H800"
        stroke="url(#asphalt)"
        strokeWidth="26"
      />
      <path
        d="M0 198 H800"
        stroke="#cfcfc7"
        strokeWidth="1.5"
        strokeDasharray="14 12"
        opacity="0.55"
      />
      <path
        d="M55 210 V560"
        stroke="url(#asphalt)"
        strokeWidth="22"
      />
      <path
        d="M745 210 V560"
        stroke="url(#asphalt)"
        strokeWidth="22"
      />

      {/* 시장 광장 바닥 */}
      <rect
        x="88"
        y="220"
        width="624"
        height="300"
        rx="8"
        fill="url(#plaza)"
        filter="url(#softShadow)"
      />
      <rect x="88" y="220" width="624" height="300" rx="8" fill="url(#pavement)" opacity="0.55" />

      {/* 중앙·횡단 통로 (시장 골목) */}
      <rect x="372" y="220" width="56" height="300" fill="#b7b1a5" />
      <rect x="88" y="348" width="624" height="44" fill="#b7b1a5" />
      <path d="M400 228 V512" stroke="#d9d3c7" strokeWidth="2" strokeDasharray="8 10" opacity="0.5" />
      <path d="M100 370 H700" stroke="#d9d3c7" strokeWidth="2" strokeDasharray="8 10" opacity="0.5" />

      {/* 점포 지붕 열 - 상공에서 본 시장 */}
      <StallRow x={104} y={236} count={5} colors={["#8b5a3c", "#a06745", "#7a4e34", "#946044", "#825538"]} label="반찬" />
      <StallRow x={250} y={236} count={4} colors={["#3f7a45", "#4d8a52", "#376f3d", "#45824b"]} label="청과" />
      <StallRow x={456} y={236} count={4} colors={["#7a3d3d", "#8a4848", "#6f3535", "#824242"]} label="정육" />
      <StallRow x={586} y={236} count={5} colors={["#3d5f7a", "#486d8a", "#35566f", "#427382", "#3a6680"]} label="수산" />

      <StallRow x={104} y={292} count={5} colors={["#9a6b3d", "#8a5f36", "#a47645", "#7f5630", "#94653a"]} />
      <StallRow x={250} y={292} count={4} colors={["#4a7f4f", "#3f7344", "#558b59", "#376a3c"]} />
      <StallRow x={456} y={292} count={4} colors={["#865050", "#764646", "#935959", "#6d4040"]} />
      <StallRow x={586} y={292} count={5} colors={["#456f88", "#3b627a", "#507d94", "#35586f", "#487892"]} />

      <StallRow x={104} y={412} count={5} colors={["#b08955", "#9c7848", "#c09862", "#8f6d42", "#a88250"]} label="떡집" />
      <StallRow x={250} y={412} count={4} colors={["#c47a45", "#b36c3b", "#d08952", "#a56236"]} label="분식" />
      <StallRow x={456} y={412} count={4} colors={["#b85d3a", "#a65232", "#c96844", "#9a4a2d"]} label="닭강정" />
      <StallRow x={586} y={412} count={5} colors={["#8a4f3a", "#7a4533", "#995744", "#6e3e2f", "#87503b"]} label="순대·족발" />

      <StallRow x={104} y={468} count={5} colors={["#a07d52", "#8f6f48", "#b08a5c", "#816440", "#9a7950"]} />
      <StallRow x={250} y={468} count={4} colors={["#c98955", "#b87948", "#d69862", "#a86c3f"]} />
      <StallRow x={456} y={468} count={4} colors={["#c46a48", "#b35e3f", "#d27854", "#a45538"]} />
      <StallRow x={586} y={468} count={5} colors={["#95604a", "#845440", "#a56c54", "#764b39", "#8f5a45"]} />

      {/* 나무 */}
      <Tree cx={70} cy={240} r={14} />
      <Tree cx={70} cy={310} r={12} />
      <Tree cx={70} cy={430} r={13} />
      <Tree cx={730} cy={250} r={13} />
      <Tree cx={730} cy={420} r={15} />
      <Tree cx={160} cy={200} r={10} />
      <Tree cx={640} cy={200} r={11} />
      <Tree cx={400} cy={200} r={9} />

      {/* 출입 표기 */}
      <g opacity="0.9">
        <rect x="378" y="214" width="44" height="10" rx="2" fill="#4a4a44" />
        <text x="400" y="208" textAnchor="middle" fill="#2f332c" fontSize="11" fontWeight="700">
          북문
        </text>
        <rect x="378" y="516" width="44" height="10" rx="2" fill="#4a4a44" />
        <text x="400" y="544" textAnchor="middle" fill="#2f332c" fontSize="11" fontWeight="700">
          남문
        </text>
        <rect x="82" y="360" width="10" height="28" rx="2" fill="#4a4a44" />
        <text x="68" y="356" textAnchor="middle" fill="#2f332c" fontSize="11" fontWeight="700">
          서문
        </text>
        <rect x="708" y="360" width="10" height="28" rx="2" fill="#4a4a44" />
        <text x="738" y="356" textAnchor="middle" fill="#2f332c" fontSize="11" fontWeight="700">
          동문
        </text>
      </g>

      <text x="400" y="338" textAnchor="middle" fill="#5a564c" fontSize="12" fontWeight="600" opacity="0.75">
        신원시장 중앙통로
      </text>
    </svg>
  );
}

function StallRow({
  x,
  y,
  count,
  colors,
  label,
}: {
  x: number;
  y: number;
  count: number;
  colors: string[];
  label?: string;
}) {
  const gap = 4;
  const w = 22;
  const h = 40;

  return (
    <g filter="url(#roofShade)">
      {Array.from({ length: count }).map((_, i) => {
        const sx = x + i * (w + gap);
        const fill = colors[i % colors.length];
        const ridge = shade(fill, 18);
        return (
          <g key={`${sx}-${y}`}>
            <rect x={sx} y={y} width={w} height={h} rx="2.5" fill={fill} />
            <path
              d={`M${sx} ${y + 3} H${sx + w}`}
              stroke={ridge}
              strokeWidth="2"
              opacity="0.55"
            />
            <rect
              x={sx + 3}
              y={y + h - 10}
              width={w - 6}
              height="5"
              rx="1"
              fill="#d8c7a8"
              opacity="0.55"
            />
          </g>
        );
      })}
      {label ? (
        <text
          x={x + (count * (w + gap) - gap) / 2}
          y={y - 5}
          textAnchor="middle"
          fill="#3a3d36"
          fontSize="10"
          fontWeight="700"
          opacity="0.72"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Tree({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <ellipse cx={cx + 1} cy={cy + 2} rx={r * 0.9} ry={r * 0.55} fill="#2f3a28" opacity="0.2" />
      <circle cx={cx} cy={cy} r={r} fill="#4f7348" />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.15} r={r * 0.55} fill="#628a58" />
      <circle cx={cx + r * 0.2} cy={cy - r * 0.1} r={r * 0.4} fill="#3f6239" opacity="0.7" />
    </g>
  );
}

function shade(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  const r = Math.min(255, ((num >> 16) & 255) + amount);
  const g = Math.min(255, ((num >> 8) & 255) + amount);
  const b = Math.min(255, (num & 255) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
