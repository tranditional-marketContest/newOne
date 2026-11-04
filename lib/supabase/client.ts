import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getSupabaseKey(),
  );
}

/** 매니저/storesApi용 — 미설정 시에도 호출부는 getSupabase로 분기하는 편이 안전 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const live = getSupabase();
    if (!live) {
      throw new Error(
        "Supabase가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL / KEY를 확인하세요.",
      );
    }
    return Reflect.get(live, prop, receiver);
  },
});
