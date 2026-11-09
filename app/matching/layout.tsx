import type { ReactNode } from "react";
import { MatchingShell } from "@/components/matching/MatchingShell";

export default function MatchingLayout({ children }: { children: ReactNode }) {
  return <MatchingShell>{children}</MatchingShell>;
}
