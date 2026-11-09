import type { ReactNode } from "react";
import { AppFrame } from "@/components/app-frame";

type PhoneShellProps = {
  children: ReactNode;
  className?: string;
};

/** 홈과 같은 430×844 화면 배율 안에 들어가는 모바일 레이아웃 */
export function PhoneShell({ children, className = "" }: PhoneShellProps) {
  return (
    <AppFrame>
      <main className="flex h-full min-h-0 w-full flex-1 flex-col bg-[#f7f3ea] text-[#1c1915]">
        <section
          className={`mx-auto flex h-full min-h-0 w-full flex-col overflow-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${className}`}
        >
          {children}
        </section>
      </main>
    </AppFrame>
  );
}
