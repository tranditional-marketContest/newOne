export type MapPin = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export async function loadMapPins(): Promise<MapPin[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  try {
    const response = await fetch(`${url}/rest/v1/stores?select=id,name,map_x,map_y&order=name.asc`, {
      headers: { apikey: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as {
      id: string;
      name: string;
      map_x: number | null;
      map_y: number | null;
    }[];
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => typeof row.map_x === "number" && typeof row.map_y === "number")
      .map((row) => ({ id: row.id, name: row.name, x: row.map_x as number, y: row.map_y as number }));
  } catch {
    return [];
  }
}
