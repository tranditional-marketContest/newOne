import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { BackIcon } from "@/components/icons";

export function SectionScreen({
  title,
  lede,
  cards,
}: {
  title: string;
  lede: string;
  cards: { title: string; body: string }[];
}) {
  return (
    <AppFrame>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link
            href="/"
            aria-label="메인 지도로"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#2a2118] shadow-sm ring-1 ring-[#2a2118]/10"
          >
            <BackIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-display text-[1.7rem] tracking-tight text-[#2a2118]">{title}</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
          <p className="text-sm leading-6 text-[#5c5146]">{lede}</p>
          <div className="mt-4 space-y-2.5">
            {cards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-[#2a2118]/8"
              >
                <h2 className="font-medium text-[#2a2118]">{card.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b5e52]">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
