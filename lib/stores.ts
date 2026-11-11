import "server-only";
import { loadStoresForMap } from "@/lib/market-stores";

export async function getStores() {
  return loadStoresForMap();
}
