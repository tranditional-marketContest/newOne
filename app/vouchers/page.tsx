"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/useAuth";
import { VOUCHERS, type Voucher, type VoucherStatus } from "@/data/vouchers";

type Filter = "all" | VoucherStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "available", label: "사용 가능" },
  { id: "used", label: "사용 완료" },
  { id: "expired", label: "만료" },
];

export default function VouchersPage() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(
    () =>
      filter === "all"
        ? VOUCHERS
        : VOUCHERS.filter((item) => item.status === filter),
    [filter],
  );

  const availableCount = VOUCHERS.filter((v) => v.status === "available").length;

  return (
    <PhoneShell>
        <header className="flex items-center gap-3">
          <Link
            href="/mypage"
            className="flex size-10 items-center justify-center rounded-xl text-[#234237]"
            aria-label="마이페이지로 돌아가기"
          >
            <BackIcon />
          </Link>
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-wide text-[#6f675c]">
              신원시장
            </p>
            <h1 className="text-[24px] font-bold tracking-tight">나의 상품권</h1>
          </div>
        </header>

        {loading ? (
          <p className="mt-10 text-[15px] text-[#6f675c]">불러오는 중…</p>
        ) : !user ? (
          <div className="mt-10">
            <p className="text-[15px] leading-6 text-[#4d463d]">
              상품권을 보려면 먼저 로그인해 주세요.
            </p>
            <Link
              href="/mypage"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-[#234237] px-5 text-[15px] font-bold text-white"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-[22px] bg-[#234237] px-5 py-4 text-white">
              <p className="text-[13px] text-white/70">사용 가능한 상품권</p>
              <p className="mt-1 text-[28px] font-bold tracking-tight">
                {availableCount}
                <span className="ml-1 text-[15px] font-medium text-white/70">
                  장
                </span>
              </p>
              <p className="mt-2 text-[13px] leading-5 text-white/65">
                5,000P가 모이면 자동으로 상품권이 발급됩니다.
              </p>
            </div>

            <div
              className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="상품권 상태 필터"
            >
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(item.id)}
                    className={`h-9 shrink-0 rounded-xl px-3.5 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[#234237] text-white"
                        : "bg-white text-[#4d463d]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <ul className="mt-5 flex flex-col gap-4">
              {list.length === 0 ? (
                <li className="rounded-[20px] bg-white px-5 py-8 text-center text-[14px] text-[#8a8174]">
                  해당 상품권이 없습니다.
                </li>
              ) : (
                list.map((voucher, index) => (
                  <li
                    key={voucher.id}
                    className="voucher-enter"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <VoucherTicket voucher={voucher} />
                  </li>
                ))
              )}
            </ul>
          </>
        )}
    </PhoneShell>
  );
}

function VoucherTicket({ voucher }: { voucher: Voucher }) {
  const disabled = voucher.status !== "available";

  return (
    <article
      className={`relative overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(35,66,55,0.08)] ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <div className="flex min-h-[132px]">
        <div className="relative flex w-[92px] shrink-0 flex-col items-center justify-center bg-[#234237] px-2 text-center text-white">
          <p className="text-[11px] font-medium tracking-[0.14em] text-white/70">
            SINWON
          </p>
          <p className="mt-2 text-[22px] leading-none font-bold tracking-tight">
            {(voucher.amount / 1000).toFixed(0)}
            <span className="text-[12px]">천</span>
          </p>
          <p className="mt-1 text-[11px] text-white/75">원권</p>
          <span className="ticket-notch ticket-notch-top" aria-hidden="true" />
          <span
            className="ticket-notch ticket-notch-bottom"
            aria-hidden="true"
          />
        </div>

        <div className="ticket-dash relative flex min-w-0 flex-1 flex-col justify-between px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight">
                {voucher.title}
              </p>
              <p className="mt-1 text-[12px] text-[#8a8174]">
                유효기간 {formatDate(voucher.expiresAt)}
              </p>
            </div>
            <StatusBadge status={voucher.status} />
          </div>

          <div className="mt-3">
            <p className="text-[22px] leading-none font-bold tracking-tight text-[#234237]">
              {voucher.amount.toLocaleString("ko-KR")}
              <span className="ml-0.5 text-[13px] font-medium">원</span>
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <Barcode pattern={voucher.code} muted={disabled} />
              <p className="pb-0.5 font-mono text-[10px] tracking-wider text-[#8a8174]">
                {voucher.code}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: VoucherStatus }) {
  const map = {
    available: { label: "사용 가능", className: "bg-[#e8f2ec] text-[#234237]" },
    used: { label: "사용 완료", className: "bg-[#efe8db] text-[#6f675c]" },
    expired: { label: "기간 만료", className: "bg-[#f6e6e2] text-[#a6452f]" },
  } as const;
  const item = map[status];

  return (
    <span
      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function Barcode({ pattern, muted }: { pattern: string; muted?: boolean }) {
  const bars = Array.from(pattern).flatMap((ch, i) => {
    const n = ch.charCodeAt(0);
    return [2 + (n % 3), 1 + ((n >> 2) % 2), 1 + ((i + n) % 3)];
  });

  return (
    <div
      className={`flex h-8 items-end gap-[1px] ${muted ? "opacity-45" : ""}`}
      aria-hidden="true"
    >
      {bars.slice(0, 28).map((w, i) => (
        <span
          key={`${pattern}-${i}`}
          className="bg-[#1c1915]"
          style={{ width: w, height: i % 5 === 0 ? "100%" : `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${y}.${m}.${d}`;
}
