import { boardMenus, isPer100g, menuBaseName } from "@/lib/menu-board";
import { formatWon, outlierLimits, priceWindow } from "@/lib/price";
import type { PricePoint, PriceSource, Store } from "@/lib/types";

function menuLabel(name: string): string {
  return isPer100g(name) ? menuBaseName(name) : name;
}

function priceText(name: string, amount: number): string {
  return `${menuLabel(name)} · 100g당 ${formatWon(amount)}`;
}

export default function WikiTable({
  store,
  source,
}: {
  store: Pick<Store, "category" | "character" | "menus" | "reviews">;
  source: PriceSource;
}) {
  const isProse = source === "prose";

  if (isProse) {
    const proseReviews = (store.reviews ?? [])
      .filter((review) => review.text.trim())
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="overflow-hidden rounded-xl border border-[#8fce9f]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#e7f6df] text-xs text-[#1d5c32]">
            <tr>
              <th className="w-12 px-3 py-2 font-semibold">id</th>
              <th className="w-28 px-3 py-2 font-semibold">카테고리</th>
              <th className="px-3 py-2 font-semibold">줄글</th>
            </tr>
          </thead>
          <tbody>
            {proseReviews.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-stone-500">
                  줄글 제보가 없습니다.
                </td>
              </tr>
            ) : (
              proseReviews.map((review, index) => (
                <tr key={review.id} className="border-t border-[#efe4d4]">
                  <td className="px-3 py-2 text-stone-500">{index + 1}</td>
                  <td className="px-3 py-2">{store.category}</td>
                  <td className="px-3 py-2">
                    <p className="text-sm leading-6 whitespace-pre-wrap">{review.text}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  const rows: { key: string; menuName: string; point: PricePoint }[] = boardMenus(store.menus).flatMap(
    (menu) =>
      priceWindow(menu.prices)
        .filter((point) => point.source === "fields")
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount)
        .map((point, index) => ({
          key: `${menu.id}-${point.date}-${point.amount}-fields-${index}`,
          menuName: menu.name,
          point,
        })),
  );

  const amountsByMenu = new Map(
    boardMenus(store.menus).map((menu) => [
      menu.name,
      priceWindow(menu.prices)
        .filter((point) => point.source === "fields")
        .map((point) => point.amount),
    ]),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4d8c6]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#fff3b0] text-xs text-[#5c4b12]">
          <tr>
            <th className="w-12 px-3 py-2 font-semibold">id</th>
            <th className="w-28 px-3 py-2 font-semibold">카테고리</th>
            <th className="px-3 py-2 font-semibold">메뉴</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-stone-500">
                직접 입력 제보가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const amounts = amountsByMenu.get(row.menuName) ?? [];
              const limits = outlierLimits(amounts);
              const outlier = limits
                ? row.point.amount < limits.low || row.point.amount > limits.high
                : false;

              return (
                <tr key={row.key} className="border-t border-[#efe4d4]">
                  <td className="px-3 py-2 text-stone-500">{index + 1}</td>
                  <td className="px-3 py-2">{store.category}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{priceText(row.menuName, row.point.amount)}</p>
                    {outlier ? (
                      <span className="mt-0.5 inline-block text-xs font-semibold text-[#c4492c]">
                        이상치 · 평균에서 제외
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
