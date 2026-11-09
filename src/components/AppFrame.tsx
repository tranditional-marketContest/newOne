"use client";

import { useLayoutEffect, useState } from "react";

const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 844;

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState({ mode: "frame" as "frame" | "fill", scale: 1 });

  useLayoutEffect(() => {
    function fit() {
      const fill = window.innerWidth < 520;
      const scale = Math.min(
        1,
        (window.innerHeight - 28) / PHONE_HEIGHT,
        (window.innerWidth - 28) / PHONE_WIDTH,
      );
      setLayout({ mode: fill ? "fill" : "frame", scale: Number(scale.toFixed(4)) });
    }

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  if (layout.mode === "fill") {
    return (
      <div className="min-h-dvh">
        <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden">
      <div
        className="relative"
        style={{ width: PHONE_WIDTH * layout.scale, height: PHONE_HEIGHT * layout.scale }}
      >
        <div
          className="absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden rounded-[28px] shadow-[0_0_0_1px_rgba(129,85,48,0.1),0_24px_60px_rgba(82,36,14,0.18)]"
          style={{
            width: PHONE_WIDTH,
            height: PHONE_HEIGHT,
            transform: `scale(${layout.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
