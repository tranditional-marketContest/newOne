import { seedStores } from "../lib/seed";
import { fetchStoresFromSupabase, seedStoresToSupabase } from "../lib/supabase/wiki";

async function main() {
  const ok = await seedStoresToSupabase(seedStores);
  if (!ok) {
    console.error("시드 실패: Supabase env 또는 권한을 확인하세요.");
    process.exit(1);
  }
  const stores = await fetchStoresFromSupabase();
  const reviewCount = stores?.reduce((sum, store) => sum + store.reviews.length, 0) ?? 0;
  const priceCount =
    stores?.reduce(
      (sum, store) => sum + store.menus.reduce((inner, menu) => inner + menu.prices.length, 0),
      0,
    ) ?? 0;
  console.log(
    JSON.stringify(
      {
        ok: true,
        stores: stores?.length ?? 0,
        reviews: reviewCount,
        prices: priceCount,
      },
      null,
      2,
    ),
  );
}

void main();
