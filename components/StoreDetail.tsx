import { buildStoreHome } from "@/lib/store-home";
import type { Store } from "@/lib/types";
import MenuBoard from "./MenuBoard";

type StoreDetailProps = {
  store: Store;
  notice: string | null;
  onEdit: () => void;
  onBack: () => void;
};

const INFO_ROWS: { key: keyof Pick<Store, "category" | "items" | "hours" | "character" | "discount" | "note" | "updatedAt">; label: string }[] = [
  { key: "category", label: "카테고리" },
  { key: "items", label: "판매품목" },
  { key: "hours", label: "운영시간" },
  { key: "character", label: "가게 성격" },
  { key: "discount", label: "할인" },
  { key: "note", label: "비고" },
  { key: "updatedAt", label: "최근 갱신" },
];

export default function StoreDetail({ store, notice, onEdit, onBack }: StoreDetailProps) {
  const reviewCount = store.reviews?.length ?? 0;
  const view = buildStoreHome(store);

  return (
    <article className="flex h-full min-h-0 flex-col rounded-2xl border border-[#e4d8c6] bg-white">
      <div className="flex items-center gap-3 border-b border-[#efe4d4] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[#e4d8c6] px-3 py-1 text-xs text-stone-600 md:hidden"
        >
          목록
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-bold">{store.name}</h2>
            <span className="shrink-0 rounded-full bg-[#ffe56a] px-2.5 py-1 text-xs font-bold">
              리뷰 {reviewCount}개
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {notice ? (
          <p className="rounded-xl bg-[#e7f6df] px-3 py-2 text-sm leading-6 text-[#1d5c32]">{notice}</p>
        ) : null}

        <PhotoGallery photos={view.photos} name={store.name} />
        <MenuBoard menus={view.menus} />

        <div className="rounded-xl border border-[#d9cbb8]">
          <div className="space-y-4 p-4">
            {INFO_ROWS.filter((row) => view[row.key]).map((row) => (
              <section key={row.key}>
                <h3 className="text-xs font-bold text-[#c4492c]">{row.label}</h3>
                <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{view[row.key]}</p>
              </section>
            ))}
            {reviewCount === 0 ? (
              <p className="text-sm leading-6 text-stone-400">아직 후기가 없어 가게 정보가 비어 있습니다.</p>
            ) : null}
          </div>
          <div className="flex justify-end border-t border-[#efe4d4] px-4 py-3">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#c4492c] bg-[#fff8f5] px-3.5 text-sm font-semibold text-[#c4492c] hover:bg-[#c4492c] hover:text-white"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
                <path
                  d="M12 5v14M5 12h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              후기 남기기
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  if (photos.length === 0) {
    return (
      <div className="grid min-h-36 place-items-center rounded-xl border border-[#e4d8c6] bg-[#faf6ef] text-sm text-stone-400">
        아직 등록된 사진이 없습니다
      </div>
    );
  }

  const main = photos[0];
  const side = photos.slice(1, 4);

  if (side.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#e4d8c6] bg-[#faf6ef]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={`${name} 사진`} className="h-full min-h-36 w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
      <div className="overflow-hidden rounded-xl border border-[#e4d8c6] bg-[#faf6ef]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={`${name} 사진`} className="h-full min-h-36 w-full object-cover" />
      </div>
      <div className="grid gap-2">
        {side.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.slice(0, 32) + index}
            src={photo}
            alt=""
            className="h-[68px] w-full rounded-xl border border-[#e4d8c6] object-cover"
          />
        ))}
      </div>
    </div>
  );
}
