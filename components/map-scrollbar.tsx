"use client";

import { useEffect, useRef } from "react";

type Props = {
  height: number;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
};

export function MapScrollBar({ height, scrollTop, onScroll }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    if (Math.abs(bar.scrollTop - scrollTop) < 1) return;
    syncing.current = true;
    bar.scrollTop = scrollTop;
    syncing.current = false;
  }, [height, scrollTop]);

  return (
    <div
      ref={ref}
      aria-label="지도 세로 스크롤"
      className="map-scrollbar h-full w-4 shrink-0 overflow-y-scroll"
      onScroll={() => {
        const bar = ref.current;
        if (!bar || syncing.current) return;
        onScroll(bar.scrollTop);
      }}
    >
      <div style={{ height: Math.max(height, 0) }} />
    </div>
  );
}
