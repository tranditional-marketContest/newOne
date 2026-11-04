import type { ReactNode } from "react";

type PhoneShellProps = {
  children: ReactNode;
  className?: string;
};

/** 실제 핸드폰 화면 폭을 그대로 쓰는 모바일 레이아웃 */
export function PhoneShell({ children, className = "" }: PhoneShellProps) {
  return (
    <main className="min-h-dvh w-full bg-[#f7f3ea] text-[#1c1915]">
      <section
        className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${className}`}
      >
        {children}
      </section>
    </main>
  );
}
