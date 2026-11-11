import { getSupabase } from "@/lib/supabase/client";
import { noteMarkedRemoved, noteWithPin, type MapPin } from "@/lib/store-pin";

export async function insertStoreToSupabase(input: {
  name: string;
  category: string;
  x: number;
  y: number;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const pin: MapPin = { x: input.x, y: input.y };
  const { error } = await supabase.from("stores").insert({
    id: `m-${Date.now().toString(36)}`,
    name: input.name.trim(),
    category: input.category,
    hours: "",
    items: "",
    character: "",
    discount: "",
    note: noteWithPin("", pin),
    photos: [],
    updated_at: new Date().toISOString().slice(0, 10),
  });

  if (error) throw error;
}

export async function deleteStoreFromSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const removed = await supabase.from("stores").delete().eq("id", id).select("id");
  if (removed.error) throw removed.error;
  if (removed.data && removed.data.length > 0) return;

  const current = await supabase.from("stores").select("note").eq("id", id).maybeSingle();
  if (current.error) throw current.error;
  if (!current.data) return;

  const updated = await supabase
    .from("stores")
    .update({
      note: noteMarkedRemoved(current.data.note ?? ""),
      updated_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);
  if (updated.error) throw updated.error;
}
