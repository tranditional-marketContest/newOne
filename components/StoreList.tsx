import type { Store } from "@/lib/types";

type StoreListProps = {
  query: string;
  stores: Store[];
  selectedId: string | null;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function StoreList({
  query,
  stores,
  selectedId,
  onQueryChange,
  onSelect,
}: StoreListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#e4d8c6] bg-white">
      <div className="border-b border-[#efe4d4] p-3">
        <label className="relative block">
          <span className="sr-only">가게 검색</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="가게 이름, 분야, 메뉴"
            className="h-11 w-full rounded-full border border-[#e4d8c6] bg-[#fffdf9] pr-11 pl-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#c4492c]"
          />
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-stone-500"
          >
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </label>
        <p className="mt-2 px-1 text-xs text-stone-500">가나다순</p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {stores.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-stone-500">찾는 가게가 없습니다.</li>
        ) : (
          stores.map((store) => {
            const selected = store.id === selectedId;
            return (
              <li key={store.id} className="border-b border-[#f3eadf] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(store.id)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                    selected ? "border-l-4 border-[#c4492c] bg-[#fff6ea]" : "border-l-4 border-transparent hover:bg-[#fffaf3]"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{store.name}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{store.category}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#8a6a12]">
                    리뷰 {store.reviews?.length ?? 0}개
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
