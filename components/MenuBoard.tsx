import { boardMenus, formatUnitPrice, withMenuUnit } from "@/lib/menu-board";
import { formatWon, summarizePrices } from "@/lib/price";
import type { MenuItem } from "@/lib/types";

type MenuBoardProps = {
  menus: MenuItem[];
  compact?: boolean;
};

function priceLabel(menu: MenuItem): string {
  const summary = summarizePrices(menu.prices);
  if (summary.average === null) return "가격 없음";
  return formatUnitPrice(summary.average, withMenuUnit(menu), formatWon);
}

export default function MenuBoard({ menus, compact = false }: MenuBoardProps) {
  const rows = boardMenus(menus);
  const removed = rows.reduce((sum, menu) => sum + summarizePrices(menu.prices).removed, 0);
  const hasWeight = rows.some((menu) => withMenuUnit(menu) === "per_100g");

  return (
    <div className={`rounded-xl bg-[#ffe56a] ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
      <p className="text-xs font-bold tracking-wide text-[#5c4b12]">메뉴 · 가격</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-[#5c4b12]">등록된 메뉴가 없습니다.</p>
      ) : (
        <ul className="mt-1">
          {rows.map((menu) => (
            <li key={menu.id} className="flex items-baseline justify-between gap-3 border-t border-black/10 py-1.5 first:border-t-0">
              <span className="text-sm font-semibold">{menu.name}</span>
              <span className="shrink-0 text-sm">{priceLabel(menu)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[11px] leading-4 text-[#6d5a16]">
        {removed > 0
          ? `최근 한 달 제보를 평균 냈고, 이상치 ${removed}건은 제외했습니다.`
          : hasWeight
            ? "최근 한 달 제보를 평균 내고, 너무 튀는 값은 빼 가격을 맞춥니다. 무게는 100g당으로 환산합니다."
            : "최근 한 달 제보를 평균 내고, 너무 튀는 값은 빼 가격을 맞춥니다."}
      </p>
    </div>
  );
}
