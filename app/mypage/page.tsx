"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/useAuth";
import {
  MANAGER_PASSWORD,
  setManagerAuthed,
} from "@/lib/managerAuth";

const POINTS = 3200;
const VOUCHER_AT = 5000;
const filled = Math.min(100, Math.round((POINTS / VOUCHER_AT) * 100));

export default function MyPage() {
  const router = useRouter();
  const { user, loading, busy, error, loginWithGoogle, logout } = useAuth();
  const [showManagerAuth, setShowManagerAuth] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");
  const [managerError, setManagerError] = useState<string | null>(null);

  function handleManagerAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (managerPassword !== MANAGER_PASSWORD) {
      setManagerError("비밀번호가 올바르지 않습니다.");
      return;
    }
    setManagerAuthed();
    setManagerError(null);
    router.push("/manager");
  }

  return (
    <PhoneShell>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex size-10 items-center justify-center rounded-xl text-[#234237]"
          aria-label="홈으로"
        >
          <BackIcon />
        </Link>
        <div className="min-w-0">
          <p className="text-[13px] font-medium tracking-wide text-[#6f675c]">
            신원시장
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">마이페이지</h1>
        </div>
      </div>

        {loading ? (
          <p className="mt-8 text-[15px] text-[#6f675c]">로그인 상태 확인 중…</p>
        ) : user ? (
          <>
            <div className="mt-8 flex items-center gap-4">
              <div className="relative shrink-0">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="size-16 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ProfileMark />
                )}
                <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(28,25,21,0.18)]">
                  <GoogleMark />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#6f675c]">
                  Google 계정
                </p>
                <p className="truncate text-[18px] font-bold tracking-tight">
                  {user.displayName ?? user.email}
                </p>
                {user.displayName && user.email ? (
                  <p className="truncate text-[13px] text-[#8a8174]">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-[22px] bg-white px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[15px] font-medium text-[#6f675c]">내 포인트</p>
                <p className="text-[26px] leading-none font-bold tracking-tight">
                  {POINTS.toLocaleString("ko-KR")}
                  <span className="ml-1 text-[15px] font-medium text-[#6f675c]">
                    P
                  </span>
                </p>
              </div>

              <div
                className="mt-4 h-4 overflow-hidden rounded-full bg-[#efe8db]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={VOUCHER_AT}
                aria-valuenow={POINTS}
                aria-label="상품권까지 모은 포인트"
              >
                <div
                  className="h-full rounded-full bg-[#e25b32]"
                  style={{ width: `${filled}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[12px] text-[#8a8174]">
                <span>0</span>
                <span>5,000P · 5,000원 상품권</span>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-[#4d463d]">
                5,000포인트가 쌓이면 5,000원 상품권으로 바뀝니다.
              </p>
            </div>

            <Link
              href="/vouchers"
              className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-[#234237] text-[16px] font-bold text-white"
            >
              나의 상품권
            </Link>

            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="mt-3 h-12 w-full rounded-2xl border border-[#d9d0c0] bg-transparent text-[15px] font-medium text-[#4d463d] disabled:opacity-60"
            >
              로그아웃
            </button>
          </>
        ) : (
          <div className="mt-8 flex flex-1 flex-col">
            <p className="text-[15px] leading-6 text-[#4d463d]">
              Google 계정으로 로그인하면 포인트와 상품권을 확인할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={busy}
              className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-[16px] font-bold text-[#1c1915] shadow-[0_1px_4px_rgba(28,25,21,0.12)] disabled:opacity-60"
            >
              <GoogleMark />
              {busy ? "로그인 중…" : "Google로 로그인"}
            </button>
            {!showManagerAuth ? (
              <button
                type="button"
                onClick={() => {
                  setShowManagerAuth(true);
                  setManagerError(null);
                }}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#d9d0c0] bg-transparent text-[15px] font-medium text-[#4d463d]"
              >
                매니저 인증하기
              </button>
            ) : (
              <form
                onSubmit={handleManagerAuth}
                className="mt-3 rounded-2xl border border-[#d9d0c0] bg-white px-4 py-4"
              >
                <label className="block">
                  <span className="text-[13px] font-medium text-[#6f675c]">
                    매니저 비밀번호
                  </span>
                  <input
                    type="password"
                    value={managerPassword}
                    onChange={(event) => {
                      setManagerPassword(event.target.value);
                      setManagerError(null);
                    }}
                    placeholder="비밀번호 입력"
                    autoFocus
                    className="mt-2 h-12 w-full rounded-xl border border-[#ddd3c3] bg-[#f7f3ea] px-3 text-[15px] outline-none focus:border-[#234237]"
                  />
                </label>
                {managerError ? (
                  <p className="mt-2 text-[13px] text-[#c0392b]">{managerError}</p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagerAuth(false);
                      setManagerPassword("");
                      setManagerError(null);
                    }}
                    className="h-11 flex-1 rounded-xl border border-[#d9d0c0] text-[14px] font-medium text-[#4d463d]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="h-11 flex-1 rounded-xl bg-[#234237] text-[14px] font-bold text-white"
                  >
                    인증하기
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {error ? (
          <p className="mt-4 text-[13px] leading-5 text-[#c0392b]">{error}</p>
        ) : null}
    </PhoneShell>
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

function ProfileMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="36" fill="#234237" />
      <circle cx="36" cy="29" r="11" fill="#f3e2c8" />
      <path
        d="M16 60c3.2-11 11-16.5 20-16.5S52.8 49 56 60"
        fill="#f3e2c8"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.1 5.6l.1.1 6.3 5.3C39.2 37.4 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
