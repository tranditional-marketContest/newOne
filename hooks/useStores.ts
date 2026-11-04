"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SEED_STORES,
  STORES_STORAGE_KEY,
  isStoreCategory,
  type Store,
  type StoreCategory,
} from "@/data/stores";

function normalizeStore(raw: Partial<Store> & { id?: string; name?: string }): Store | null {
  if (!raw.id || !raw.name || typeof raw.x !== "number" || typeof raw.y !== "number") {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name,
    category: isStoreCategory(raw.category) ? raw.category : "기타",
    x: raw.x,
    y: raw.y,
  };
}

function readStores(): Store[] {
  if (typeof window === "undefined") return SEED_STORES;
  try {
    const raw = window.localStorage.getItem(STORES_STORAGE_KEY);
    if (!raw) return SEED_STORES;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return SEED_STORES;
    const stores = parsed
      .map((item) => normalizeStore(item as Partial<Store>))
      .filter((item): item is Store => item !== null);
    return stores.length > 0 ? stores : SEED_STORES;
  } catch {
    return SEED_STORES;
  }
}

function writeStores(stores: Store[]) {
  window.localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>(SEED_STORES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStores(readStores());
    setReady(true);
  }, []);

  const persist = useCallback((next: Store[]) => {
    setStores(next);
    writeStores(next);
  }, []);

  const addStore = useCallback(
    (input: Omit<Store, "id">) => {
      const store: Store = {
        id: `store-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: input.name.trim(),
        category: input.category,
        x: input.x,
        y: input.y,
      };
      persist([...readStores(), store]);
      return store;
    },
    [persist],
  );

  const removeStore = useCallback(
    (id: string) => {
      persist(readStores().filter((store) => store.id !== id));
    },
    [persist],
  );

  const resetStores = useCallback(() => {
    persist(SEED_STORES);
  }, [persist]);

  return { stores, ready, addStore, removeStore, resetStores };
}

export type { StoreCategory };
