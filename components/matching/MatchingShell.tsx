"use client";

import type { ReactNode } from "react";
import { AppFrame } from "@/components/app-frame";
import { MatchingStoreProvider } from "@/lib/matching/store";

export function MatchingShell({ children }: { children: ReactNode }) {
  return (
    <AppFrame>
      <MatchingStoreProvider>
        <div className="matching-root">
          <div className="app-shell">{children}</div>
        </div>
      </MatchingStoreProvider>
    </AppFrame>
  );
}
