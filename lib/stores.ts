import "server-only";
import { placeStores, type StoreRow } from "@/data/market";
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
    throw new Error("Supabase 환경 변수가 설정되어 있지 않습니다.");
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id,name,category,hours,items,character,discount,note,photos")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as StoreRecord[]).map(toRow);
  return placeStores(rows);
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
