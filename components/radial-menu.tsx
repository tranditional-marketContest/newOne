import Link from "next/link";
import { BookIcon, PathIcon, SplitIcon } from "@/components/icons";

const CX = 180;
const CY = 178;
const RADIUS = 158;
const VIEW_W = 360;
const VIEW_H = 220;

const sectors = [
  {
    href: "/wiki",
    label: "신원위키",
    lines: ["신원", "위키"],
    start: 176,
    end: 124,
    mid: 150,
    color: "#31406F",
    icon: BookIcon,
  },
  {
    href: "/course",
    label: "코스 추천",
    lines: ["코스", "추천"],
    start: 116,
    end: 64,
    mid: 90,
    color: "#C56A32",
    icon: PathIcon,
  },
  {
    href: "/matching",
    label: "반띵 매칭",
    lines: ["반띵", "매칭"],
    start: 56,
    end: 4,
    mid: 30,
    color: "#A33D56",
    icon: SplitIcon,
  },
] as const;

function polar(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.round((CX + radius * Math.cos(rad)) * 100) / 100,
    y: Math.round((CY - radius * Math.sin(rad)) * 100) / 100,
  };
}

function sectorPath(start: number, end: number) {
  const from = polar(start, RADIUS);
  const to = polar(end, RADIUS);
  return `M ${CX} ${CY} L ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y} Z`;
}

export function RadialMenu() {
  return (
    <nav aria-label="주요 메뉴" className="relative shrink-0 pb-[env(safe-area-inset-bottom)]">
      <div className="relative">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="fan-svg pointer-events-none block h-auto w-full" aria-hidden>
          {sectors.map((sector) => (
            <path key={sector.href} className="fan-sector" d={sectorPath(sector.start, sector.end)} fill={sector.color} />
          ))}
          <g aria-hidden>
            <circle cx={CX} cy={CY} r="34" fill="#FFFBF6" className="pointer-events-auto" />
            <circle cx={CX} cy={CY} r="34" fill="none" stroke="#9B2335" strokeWidth="1.6" />
            <circle cx={CX} cy={CY} r="26" fill="none" stroke="#F0D5C8" strokeWidth="0.9" />
            <text
              x={CX}
              y={CY + 7}
              textAnchor="middle"
              fill="#9B2335"
              fontSize="18"
              className="font-display"
            >
              신
            </text>
          </g>
        </svg>

        <div className="absolute inset-x-0 top-[18%] bottom-0 z-10 grid grid-cols-3">
          {sectors.map((sector) => (
            <Link
              key={sector.href}
              href={sector.href}
              aria-label={`${sector.label} 화면으로 이동`}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffaf3]"
            />
          ))}
        </div>
        <div
          aria-hidden
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: "50%",
            top: `${(CY / VIEW_H) * 100}%`,
            width: `${(68 / VIEW_W) * 100}%`,
            aspectRatio: "1",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          {sectors.map((sector) => {
            const point = polar(sector.mid, 102);
            const Icon = sector.icon;
            return (
              <div
                key={sector.href}
                className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-white"
                style={{
                  left: `${(point.x / VIEW_W) * 100}%`,
                  top: `${(point.y / VIEW_H) * 100}%`,
                }}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                <span className="text-center text-[13px] leading-4 font-semibold tracking-tight">
                  {sector.lines[0]}
                  <br />
                  {sector.lines[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
