import "server-only";
import type { StoreRow } from "@/data/market";
import { placeOnBlockMap, seedStoresOnMap } from "@/lib/market-stores";
import { getSupabase } from "@/lib/supabase/client";

type StoreRecord = {
  id: string;
  name: string;
  category: string;
  hours: string | null;
  items: string | null;
  character: string | null;
  discount: string | null;
  note: string | null;
  photos: string[] | null;
};

export async function getStores() {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("Supabase 환경 변수가 없어 신원위키 가게를 씁니다.");
    return seedStoresOnMap();
  }

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("id,name,category,hours,items,character,discount,note,photos")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("Supabase stores 조회 실패:", error?.message ?? "등록된 가게 없음");
      return seedStoresOnMap();
    }

    const rows = (data as StoreRecord[]).map(toRow);
    return placeOnBlockMap(rows);
  } catch (err) {
    console.warn("Supabase stores 요청 실패:", err);
    return seedStoresOnMap();
  }
}

function toRow(record: StoreRecord): StoreRow {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    hours: record.hours?.trim() ?? "",
    items: record.items?.trim() ?? "",
    character: record.character?.trim() ?? "",
    discount: record.discount?.trim() ?? "",
    note: record.note?.trim() ?? "",
    photos: (record.photos ?? []).filter((photo) => photo.startsWith("https://")),
  };
}
