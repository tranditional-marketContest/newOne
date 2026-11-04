import {
  isStoreCategory,
  type Store,
  type StoreCategory,
} from "@/data/stores";
import { supabase } from "@/lib/supabase/client";

/** Supabase public.stores 행 */
export type StoreRow = {
  id: string;
  name: string;
  category: string;
  map_x: number;
  map_y: number;
  created_at?: string;
};

export function rowToStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    category: isStoreCategory(row.category) ? row.category : "기타",
    x: Number(row.map_x),
    y: Number(row.map_y),
  };
}

export async function fetchStoresFromSupabase(): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("id,name,category,map_x,map_y,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as StoreRow[] | null)?.map(rowToStore) ?? [];
}

export async function insertStoreToSupabase(input: {
  name: string;
  category: StoreCategory;
  x: number;
  y: number;
}): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: input.name.trim(),
      category: input.category,
      map_x: input.x,
      map_y: input.y,
    })
    .select("id,name,category,map_x,map_y,created_at")
    .single();

  if (error) throw error;
  return rowToStore(data as StoreRow);
}

export async function deleteStoreFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) throw error;
}
