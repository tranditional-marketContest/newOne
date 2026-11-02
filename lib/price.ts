import type { PricePoint } from "./types";

export function seoulToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatWon(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

function quantile(sorted: number[], p: number): number {
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}

export function robustMean(values: number[]): { average: number | null; removed: number } {
  if (values.length === 0) return { average: null, removed: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length < 4) {
    const average = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    return { average: Math.round(average), removed: 0 };
  }

  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const kept = sorted.filter((value) => value >= low && value <= high);
  const used = kept.length > 0 ? kept : sorted;
  const average = used.reduce((sum, value) => sum + value, 0) / used.length;
  return { average: Math.round(average), removed: sorted.length - used.length };
}

export type PriceSummary = {
  average: number | null;
  reports: number;
  removed: number;
  windowLabel: string;
};

export function priceWindow(points: PricePoint[], today = seoulToday()): PricePoint[] {
  const cutoff = addDays(today, -30);
  const recent = points.filter((point) => point.date >= cutoff && point.date <= today);
  return recent.length > 0 ? recent : points;
}

export function outlierLimits(values: number[]): { low: number; high: number } | null {
  if (values.length < 4) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  return { low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr };
}

export function summarizePrices(points: PricePoint[], today = seoulToday()): PriceSummary {
  const cutoff = addDays(today, -30);
  const recent = points.filter((point) => point.date >= cutoff && point.date <= today);
  const pool = recent.length > 0 ? recent : points;
  const { average, removed } = robustMean(pool.map((point) => point.amount));
  return {
    average,
    reports: pool.length,
    removed,
    windowLabel: recent.length > 0 ? "최근 한 달" : "전체 제보",
  };
}
