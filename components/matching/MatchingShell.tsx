"use client";

import type { ReactNode } from "react";
import { MatchingStoreProvider } from "@/lib/matching/store";

export function MatchingShell({ children }: { children: ReactNode }) {
  return (
    <MatchingStoreProvider>
      <div className="matching-root">
        <div className="app-shell">{children}</div>
      </div>
    </MatchingStoreProvider>
  );
}
