const PIN_LINE = /^@@pin:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;
const REMOVED_LINE = "@@removed";

export type MapPin = { x: number; y: number };

function lines(note: string | null | undefined) {
  return (note ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function readPin(note: string | null | undefined): MapPin | null {
  for (const line of lines(note)) {
    const match = line.match(PIN_LINE);
    if (!match) continue;
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }
  return null;
}

export function isRemovedStore(note: string | null | undefined) {
  return lines(note).includes(REMOVED_LINE);
}

export function visibleNote(note: string | null | undefined) {
  return lines(note)
    .filter((line) => line !== REMOVED_LINE && !PIN_LINE.test(line))
    .join("\n");
}

export function noteWithPin(note: string, pin: MapPin | null | undefined) {
  const base = visibleNote(note);
  if (!pin) return base;
  const line = `@@pin:${pin.x.toFixed(1)},${pin.y.toFixed(1)}`;
  return base ? `${base}\n${line}` : line;
}

export function noteMarkedRemoved(note: string | null | undefined) {
  const base = visibleNote(note);
  return base ? `${base}\n${REMOVED_LINE}` : REMOVED_LINE;
}
