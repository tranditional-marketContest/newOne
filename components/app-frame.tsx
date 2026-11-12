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
      <div className="min-h-dvh bg-[#fbf6ef]">
        <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-[#fbf6ef]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#e7d7c6]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 12%, rgba(255,248,240,0.95) 0, transparent 34%), radial-gradient(circle at 88% 84%, rgba(194,122,86,0.28) 0, transparent 32%)",
        }}
      />
      <div
        className="relative"
        style={{ width: PHONE_WIDTH * layout.scale, height: PHONE_HEIGHT * layout.scale }}
      >
        <div
          className="absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden bg-[#fbf6ef] shadow-[0_30px_80px_rgba(80,48,24,0.18)] ring-1 ring-[#2a2118]/10 rounded-[2rem]"
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
