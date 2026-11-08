import {
  BLOCK_ROAD_B64,
  BLOCK_ROAD_COLS,
  BLOCK_ROAD_ROWS,
  BLOCK_ROAD_STEP,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/lib/block-road-data";

const COLS = BLOCK_ROAD_COLS;
const ROWS = BLOCK_ROAD_ROWS;
const CELLS = COLS * ROWS;
const bytes = Uint8Array.from(atob(BLOCK_ROAD_B64), (char) => char.charCodeAt(0));
const parent = new Int32Array(CELLS);
parent.fill(-1);
const queue = new Int32Array(CELLS);
const pathCache = new Map<string, { hops: number; cells: number[] }>();
const roadId = new Int32Array(CELLS);

function neighborIndexes(index: number) {
  const col = index % COLS;
  const row = (index / COLS) | 0;
  const found: number[] = [];
  if (col > 0 && walkable(index - 1)) found.push(index - 1);
  if (col + 1 < COLS && walkable(index + 1)) found.push(index + 1);
  if (row > 0 && walkable(index - COLS)) found.push(index - COLS);
  if (row + 1 < ROWS && walkable(index + COLS)) found.push(index + COLS);
  return found;
}

function buildRoadIds() {
  const junction = new Uint8Array(CELLS);
  let index = 0;
  while (index < CELLS) {
    if (walkable(index) && neighborIndexes(index).length >= 3) junction[index] = 1;
    index += 1;
  }
  let nextId = 1;
  index = 0;
  while (index < CELLS) {
    if (walkable(index) && junction[index] === 0 && roadId[index] === 0) {
      const id = nextId;
      nextId += 1;
      const pending = [index];
      roadId[index] = id;
      let head = 0;
      while (head < pending.length) {
        const current = pending[head];
        head += 1;
        const neighbors = neighborIndexes(current);
        let neighbor = 0;
        while (neighbor < neighbors.length) {
          const next = neighbors[neighbor];
          if (junction[next] === 0 && roadId[next] === 0) {
            roadId[next] = id;
            pending.push(next);
          }
          neighbor += 1;
        }
      }
    }
    index += 1;
  }
}

export type MapPoint = { x: number; y: number };

function cellAt(col: number, row: number) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return -1;
  return row * COLS + col;
}

export const VISIBLE_TOP_PX = 58;
export const VISIBLE_BOTTOM_PX = 291;
const FIRST_ROW = Math.ceil(VISIBLE_TOP_PX / BLOCK_ROAD_STEP);
const LAST_ROW = Math.floor(VISIBLE_BOTTOM_PX / BLOCK_ROAD_STEP) - 1;

const DETOUR_LAST_ROW = 67;
const DETOUR_LAST_COL = 119;
const RIVER_FIRST_ROW = 35;
const RIVER_LAST_ROW = 72;
const BRIDGES = [
  { from: 285, to: 300 },
  { from: 435, to: 455 },
];

function walkable(index: number) {
  if (index < 0 || index >= CELLS) return false;
  const row = (index / COLS) | 0;
  if (row < FIRST_ROW || row > LAST_ROW) return false;
  if (row <= DETOUR_LAST_ROW && index % COLS <= DETOUR_LAST_COL) return false;
  return (bytes[index >> 3] & (1 << (index & 7))) !== 0;
}

function bridgeAt(index: number) {
  const row = (index / COLS) | 0;
  if (row < RIVER_FIRST_ROW || row > RIVER_LAST_ROW) return -1;
  const col = index % COLS;
  return BRIDGES.findIndex((bridge) => col >= bridge.from && col <= bridge.to);
}

function lastBridge(cells: number[], fallback: number) {
  let found = fallback;
  for (const cell of cells) {
    const bridge = bridgeAt(cell);
    if (bridge >= 0) found = bridge;
  }
  return found;
}

buildRoadIds();

function snap(x: number, y: number) {
  const col = Math.max(0, Math.min(COLS - 1, Math.floor((x / 100) * MAP_WIDTH / BLOCK_ROAD_STEP)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor((y / 100) * MAP_HEIGHT / BLOCK_ROAD_STEP)));
  const origin = row * COLS + col;
  if (walkable(origin)) return origin;
  let radius = 1;
  while (radius <= 70) {
    let delta = -radius;
    while (delta <= radius) {
      const candidates = [
        cellAt(col + delta, row - radius),
        cellAt(col + delta, row + radius),
        cellAt(col - radius, row + delta),
        cellAt(col + radius, row + delta),
      ];
      let index = 0;
      while (index < candidates.length) {
        if (walkable(candidates[index])) return candidates[index];
        index += 1;
      }
      delta += 1;
    }
    radius += 1;
  }
  return -1;
}

function search(start: number, goal: number) {
  const key = `${start}:${goal}`;
  const cached = pathCache.get(key);
  if (cached) return cached;
  const seen: number[] = [];
  let head = 0;
  let tail = 0;
  queue[tail] = start;
  tail += 1;
  parent[start] = start;
  seen.push(start);
  let found = start === goal;
  while (head < tail && !found) {
    const current = queue[head];
    head += 1;
    const col = current % COLS;
    const row = (current / COLS) | 0;
    const next = [
      col > 0 ? current - 1 : -1,
      col + 1 < COLS ? current + 1 : -1,
      row > 0 ? current - COLS : -1,
      row + 1 < ROWS ? current + COLS : -1,
    ];
    let index = 0;
    while (index < next.length) {
      const candidate = next[index];
      if (candidate >= 0 && parent[candidate] === -1 && walkable(candidate)) {
        parent[candidate] = current;
        queue[tail] = candidate;
        tail += 1;
        seen.push(candidate);
        if (candidate === goal) found = true;
      }
      index += 1;
    }
  }
  const cells: number[] = [];
  if (found) {
    let current = goal;
    while (current !== start) {
      cells.push(current);
      current = parent[current];
    }
    cells.push(start);
    cells.reverse();
  }
  let index = 0;
  while (index < seen.length) {
    parent[seen[index]] = -1;
    index += 1;
  }
  const route = { hops: cells.length > 1 ? cells.length - 1 : -1, cells: simplify(cells) };
  pathCache.set(key, route);
  return route;
}

function simplify(cells: number[]) {
  if (cells.length <= 2) return cells;
  const kept = [cells[0]];
  let index = 1;
  while (index < cells.length - 1) {
    const previous = cells[index - 1];
    const current = cells[index];
    const next = cells[index + 1];
    const sameRow = (previous / COLS) | 0;
    const currentRow = (current / COLS) | 0;
    const nextRow = (next / COLS) | 0;
    const straight =
      (sameRow === currentRow && currentRow === nextRow) ||
      (previous % COLS === current % COLS && current % COLS === next % COLS);
    if (!straight) kept.push(current);
    index += 1;
  }
  kept.push(cells[cells.length - 1]);
  return kept;
}

function cellPoint(index: number): MapPoint {
  const col = index % COLS;
  const row = (index / COLS) | 0;
  return {
    x: Math.round(((col * BLOCK_ROAD_STEP + BLOCK_ROAD_STEP / 2) / MAP_WIDTH) * 1000) / 10,
    y: Math.round(((row * BLOCK_ROAD_STEP + BLOCK_ROAD_STEP / 2) / MAP_HEIGHT) * 1000) / 10,
  };
}

export function roadDistance(from: MapPoint, to: MapPoint) {
  const start = snap(from.x, from.y);
  const goal = snap(to.x, to.y);
  if (start < 0 || goal < 0) return -1;
  if (start === goal) return 0;
  return search(start, goal).hops;
}

export function roadHeading(from: MapPoint, to: MapPoint, fromEnd = false) {
  const start = snap(from.x, from.y);
  const goal = snap(to.x, to.y);
  if (start < 0 || goal < 0 || start === goal) return null;
  const cells = search(start, goal).cells;
  if (cells.length < 2) return null;
  const originIndex = fromEnd ? Math.max(0, cells.length - 13) : 0;
  const aheadIndex = fromEnd ? cells.length - 1 : Math.min(cells.length - 1, 12);
  const origin = cellPoint(cells[originIndex]);
  const ahead = cellPoint(cells[aheadIndex]);
  return { x: ahead.x - origin.x, y: ahead.y - origin.y };
}

type RoadBan = { horizontal: boolean; line: number; from: number; to: number; dir: number };

function opposite(from: number, to: number, bans: RoadBan[]) {
  const fromCol = from % COLS;
  const fromRow = (from / COLS) | 0;
  const toCol = to % COLS;
  const toRow = (to / COLS) | 0;
  let index = 0;
  while (index < bans.length) {
    const ban = bans[index];
    if (ban.horizontal && fromRow === toRow && Math.abs(fromRow - ban.line) <= 6) {
      const dir = toCol > fromCol ? 1 : -1;
      const low = Math.min(fromCol, toCol);
      const high = Math.max(fromCol, toCol);
      if (dir === -ban.dir && high >= ban.from && low <= ban.to) return true;
    }
    if (!ban.horizontal && fromCol === toCol && Math.abs(fromCol - ban.line) <= 6) {
      const dir = toRow > fromRow ? 1 : -1;
      const low = Math.min(fromRow, toRow);
      const high = Math.max(fromRow, toRow);
      if (dir === -ban.dir && high >= ban.from && low <= ban.to) return true;
    }
    index += 1;
  }
  return false;
}

function addBan(from: number, to: number, bans: RoadBan[]) {
  const fromCol = from % COLS;
  const fromRow = (from / COLS) | 0;
  const toCol = to % COLS;
  const toRow = (to / COLS) | 0;
  if (fromRow === toRow && fromCol !== toCol) {
    bans.push({ horizontal: true, line: fromRow, from: Math.min(fromCol, toCol), to: Math.max(fromCol, toCol), dir: toCol > fromCol ? 1 : -1 });
  } else if (fromCol === toCol && fromRow !== toRow) {
    bans.push({ horizontal: false, line: fromCol, from: Math.min(fromRow, toRow), to: Math.max(fromRow, toRow), dir: toRow > fromRow ? 1 : -1 });
  }
}

function snapOpen(x: number, y: number) {
  const col = Math.max(0, Math.min(COLS - 1, Math.floor(((x / 100) * MAP_WIDTH) / BLOCK_ROAD_STEP)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(((y / 100) * MAP_HEIGHT) / BLOCK_ROAD_STEP)));
  const origin = row * COLS + col;
  if (walkable(origin)) return origin;
  let radius = 1;
  while (radius <= 70) {
    let delta = -radius;
    while (delta <= radius) {
      const candidates = [
        cellAt(col + delta, row - radius),
        cellAt(col + delta, row + radius),
        cellAt(col - radius, row + delta),
        cellAt(col + radius, row + delta),
      ];
      let index = 0;
      while (index < candidates.length) {
        if (walkable(candidates[index])) return candidates[index];
        index += 1;
      }
      delta += 1;
    }
    radius += 1;
  }
  return -1;
}

function searchOpen(start: number, goal: number, bans: RoadBan[], closedBridge = -1) {
  if (start < 0 || goal < 0 || !walkable(goal)) return null;
  if (start === goal) return [start];
  const seen: number[] = [];
  let head = 0;
  let tail = 0;
  queue[tail] = start;
  tail += 1;
  parent[start] = start;
  seen.push(start);
  let found = false;
  while (head < tail && !found) {
    const current = queue[head];
    head += 1;
    const col = current % COLS;
    const row = (current / COLS) | 0;
    const next = [
      col > 0 ? current - 1 : -1,
      col + 1 < COLS ? current + 1 : -1,
      row > 0 ? current - COLS : -1,
      row + 1 < ROWS ? current + COLS : -1,
    ];
    let index = 0;
    while (index < next.length) {
      const candidate = next[index];
      if (
        candidate >= 0 &&
        parent[candidate] === -1 &&
        walkable(candidate) &&
        (closedBridge < 0 || bridgeAt(candidate) !== closedBridge) &&
        !opposite(current, candidate, bans)
      ) {
        parent[candidate] = current;
        queue[tail] = candidate;
        tail += 1;
        seen.push(candidate);
        if (candidate === goal) found = true;
      }
      index += 1;
    }
  }
  const cells: number[] = [];
  if (found) {
    let current = goal;
    while (current !== start) {
      cells.push(current);
      current = parent[current];
    }
    cells.push(start);
    cells.reverse();
  }
  let index = 0;
  while (index < seen.length) {
    parent[seen[index]] = -1;
    index += 1;
  }
  return cells.length > 0 ? cells : null;
}

function searchLeg(start: number, goal: number, bans: RoadBan[], closedBridge: number) {
  return (
    searchOpen(start, goal, bans, closedBridge) ??
    searchOpen(start, goal, [], closedBridge) ??
    searchOpen(start, goal, [], -1)
  );
}

function spanClear(col0: number, row0: number, col1: number, row1: number) {
  if (row0 === row1) {
    const step = col0 < col1 ? 1 : -1;
    let col = col0;
    while (col !== col1) {
      if (!walkable(cellAt(col, row0))) return false;
      col += step;
    }
    return true;
  }
  if (col0 === col1) {
    const step = row0 < row1 ? 1 : -1;
    let row = row0;
    while (row !== row1) {
      if (!walkable(cellAt(col0, row))) return false;
      row += step;
    }
    return true;
  }
  return false;
}

function longestOnAxis(cells: number[], index: number, startCol: number, startRow: number, horizontal: boolean) {
  const origin = horizontal ? startRow : startCol;
  const limit = horizontal ? ROWS : COLS;
  let bestLine = origin;
  let bestLast = index;
  let bestGain = 0;
  let delta = -4;
  while (delta <= 4) {
    const line = origin + delta;
    if (line < 0 || line >= limit) {
      delta += 1;
      continue;
    }
    const elbowClear = horizontal ? spanClear(startCol, startRow, startCol, line) : spanClear(startCol, startRow, line, startRow);
    if (!elbowClear) {
      delta += 1;
      continue;
    }
    let last = index;
    let probe = index + 1;
    while (probe < cells.length) {
      const col = cells[probe] % COLS;
      const row = (cells[probe] / COLS) | 0;
      if (horizontal && Math.abs(row - line) > 4) break;
      if (!horizontal && Math.abs(col - line) > 4) break;
      const clear = horizontal ? spanClear(startCol, line, col, line) : spanClear(line, startRow, line, row);
      if (!clear) break;
      last = probe;
      probe += 1;
    }
    const endCol = cells[last] % COLS;
    const endRow = (cells[last] / COLS) | 0;
    const gain = horizontal ? Math.abs(endCol - startCol) : Math.abs(endRow - startRow);
    if (gain > bestGain || (gain === bestGain && Math.abs(line - origin) < Math.abs(bestLine - origin))) {
      bestGain = gain;
      bestLast = last;
      bestLine = line;
    }
    delta += 1;
  }
  return { line: bestLine, last: bestLast, gain: bestGain };
}

function pullAxis(cells: number[]) {
  if (cells.length <= 1) return cells;
  const kept = [cells[0]];
  let index = 0;
  while (index < cells.length - 1) {
    const start = kept[kept.length - 1];
    const startCol = start % COLS;
    const startRow = (start / COLS) | 0;
    const across = longestOnAxis(cells, index, startCol, startRow, true);
    const down = longestOnAxis(cells, index, startCol, startRow, false);
    const horizontal = across.gain >= down.gain && across.gain > 0;
    const chosen = horizontal ? across : down;
    if (chosen.gain === 0) {
      const next = cells[Math.min(index + 1, cells.length - 1)];
      const nextCol = next % COLS;
      const nextRow = (next / COLS) | 0;
      let step = next;
      if (nextCol !== startCol && nextRow !== startRow) {
        if (spanClear(startCol, startRow, nextCol, startRow)) step = cellAt(nextCol, startRow);
        else step = cellAt(startCol, nextRow);
      }
      if (step !== start) kept.push(step);
      index += 1;
      continue;
    }
    const endCol = cells[chosen.last] % COLS;
    const endRow = (cells[chosen.last] / COLS) | 0;
    if (horizontal) {
      if (chosen.line !== startRow) {
        const elbow = cellAt(startCol, chosen.line);
        if (elbow !== start) kept.push(elbow);
      }
      const end = cellAt(endCol, chosen.line);
      if (end !== kept[kept.length - 1]) kept.push(end);
    } else {
      if (chosen.line !== startCol) {
        const elbow = cellAt(chosen.line, startRow);
        if (elbow !== start) kept.push(elbow);
      }
      const end = cellAt(chosen.line, endRow);
      if (end !== kept[kept.length - 1]) kept.push(end);
    }
    index = Math.max(chosen.last, index + 1);
  }
  return kept;
}

function smoothJogs(cells: number[]) {
  if (cells.length <= 2) return cells;
  const kept = [cells[0]];
  let index = 1;
  while (index < cells.length) {
    const previous = kept[kept.length - 1];
    const current = cells[index];
    const upcoming = index + 1 < cells.length ? cells[index + 1] : -1;
    if (upcoming >= 0) {
      const previousCol = previous % COLS;
      const previousRow = (previous / COLS) | 0;
      const currentCol = current % COLS;
      const currentRow = (current / COLS) | 0;
      const nextCol = upcoming % COLS;
      const nextRow = (upcoming / COLS) | 0;
      const shortHorizontal = previousRow === currentRow && Math.abs(previousCol - currentCol) <= 3 && currentCol === nextCol;
      const shortVertical = previousCol === currentCol && Math.abs(previousRow - currentRow) <= 3 && currentRow === nextRow;
      if (shortHorizontal && spanClear(previousCol, previousRow, previousCol, nextRow)) {
        const end = cellAt(previousCol, nextRow);
        if (end !== previous) kept.push(end);
        index += 2;
        continue;
      }
      if (shortVertical && spanClear(previousCol, previousRow, nextCol, previousRow)) {
        const end = cellAt(nextCol, previousRow);
        if (end !== previous) kept.push(end);
        index += 2;
        continue;
      }
    }
    if (current !== previous) kept.push(current);
    index += 1;
  }
  return kept;
}

function trimEnds(cells: number[]) {
  if (cells.length <= 2) return cells;
  const span = (from: number, to: number) => Math.abs((from % COLS) - (to % COLS)) + Math.abs(((from / COLS) | 0) - ((to / COLS) | 0));
  let start = 0;
  let trimmed = 0;
  while (start < cells.length - 2 && span(cells[start], cells[start + 1]) <= 6 && trimmed + span(cells[start], cells[start + 1]) <= 8) {
    trimmed += span(cells[start], cells[start + 1]);
    start += 1;
  }
  let end = cells.length - 1;
  trimmed = 0;
  while (end > start + 1 && span(cells[end - 1], cells[end]) <= 6 && trimmed + span(cells[end - 1], cells[end]) <= 8) {
    trimmed += span(cells[end - 1], cells[end]);
    end -= 1;
  }
  return cells.slice(start, end + 1);
}

function banAxis(cells: number[], bans: RoadBan[]) {
  let index = 1;
  while (index < cells.length) {
    addBan(cells[index - 1], cells[index], bans);
    index += 1;
  }
}

function formatPoint(point: MapPoint) {
  return `${Math.round(point.x * 10) / 10},${Math.round(point.y * 10) / 10}`;
}

export type RoadLeg = { depart: MapPoint; arrive: MapPoint };

function collapseAxis(points: MapPoint[]) {
  if (points.length <= 2) return points;
  const kept = [points[0]];
  let index = 1;
  while (index < points.length - 1) {
    const previous = kept[kept.length - 1];
    const current = points[index];
    const next = points[index + 1];
    const sameRow = Math.abs(previous.y - current.y) < 0.05 && Math.abs(current.y - next.y) < 0.05;
    const sameCol = Math.abs(previous.x - current.x) < 0.05 && Math.abs(current.x - next.x) < 0.05;
    if (!sameRow && !sameCol) kept.push(current);
    index += 1;
  }
  kept.push(points[points.length - 1]);
  return kept;
}

export function orderByOpenRoad<T extends MapPoint>(origin: MapPoint, stops: T[]) {
  if (stops.length <= 1) return [...stops];
  const bans: RoadBan[] = [];
  const pool = stops.map((stop) => stop);
  let best = 0;
  let bestHops = Number.POSITIVE_INFINITY;
  let index = 0;
  while (index < pool.length) {
    const hops = roadDistance(origin, pool[index]);
    const score = hops >= 0 ? hops : 100000 + Math.hypot(origin.x - pool[index].x, origin.y - pool[index].y);
    if (score < bestHops) {
      bestHops = score;
      best = index;
    }
    index += 1;
  }
  const ordered = [pool.splice(best, 1)[0]];
  const firstLeg = searchOpen(snapOpen(origin.x, origin.y), snapOpen(ordered[0].x, ordered[0].y), []);
  let usedBridge = firstLeg ? lastBridge(firstLeg, -1) : -1;
  while (pool.length > 0) {
    const from = ordered[ordered.length - 1];
    let pick = -1;
    let pickHops = Number.POSITIVE_INFINITY;
    let pickCells: number[] | null = null;
    index = 0;
    while (index < pool.length) {
      const cells = searchLeg(snapOpen(from.x, from.y), snapOpen(pool[index].x, pool[index].y), bans, usedBridge);
      if (cells && cells.length - 1 < pickHops) {
        pickHops = cells.length - 1;
        pick = index;
        pickCells = cells;
      }
      index += 1;
    }
    if (pick < 0 || !pickCells) break;
    banAxis(pullAxis(pickCells), bans);
    usedBridge = lastBridge(pickCells, usedBridge);
    ordered.push(pool.splice(pick, 1)[0]);
  }
  return ordered;
}

export function walkCourse(points: MapPoint[]) {
  const bans: RoadBan[] = [];
  const drawn: MapPoint[] = [];
  const legs: RoadLeg[] = [];
  if (points.length === 0) return { line: "", legs };
  drawn.push(points[0]);
  let door = snapOpen(points[0].x, points[0].y);
  let usedBridge = -1;
  let index = 0;
  while (index < points.length - 1) {
    const to = points[index + 1];
    const goalDoor = snapOpen(to.x, to.y);
    const cells = searchLeg(door, goalDoor, bans, usedBridge);
    if (!cells) break;
    usedBridge = lastBridge(cells, usedBridge);
    const axis = trimEnds(smoothJogs(pullAxis(cells)));
    banAxis(axis, bans);
    let point = 0;
    while (point < axis.length) {
      drawn.push(cellPoint(axis[point]));
      point += 1;
    }
    const first = cellPoint(axis[0]);
    const second = cellPoint(axis[Math.min(1, axis.length - 1)]);
    const penultimate = cellPoint(axis[Math.max(0, axis.length - 2)]);
    const last = cellPoint(axis[axis.length - 1]);
    legs.push({
      depart: { x: second.x - first.x, y: second.y - first.y },
      arrive: { x: last.x - penultimate.x, y: last.y - penultimate.y },
    });
    drawn.push(to);
    door = goalDoor;
    index += 1;
  }
  const line = collapseAxis(drawn).map(formatPoint).join(" ");
  return { line, legs };
}

export function roadPolyline(points: MapPoint[]) {
  return walkCourse(points).line;
}
