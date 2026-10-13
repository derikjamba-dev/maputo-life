import type { Position } from "@/types/game";
import type { Building, CityWorld, WorldPoint } from "@/types/world";

export interface PlayerRuntime {
  pos: Position;
  path: Position[] | null;
  moveTarget: Position | null;
  walk: number;
}

const PLAYER_RADIUS = 11;
const WAYPOINT_EPS = 6;
const NODE_SNAP = 30;
const MAX_ATTACH = 260;

export function intentFromKeys(keys: Set<string>): WorldPoint | null {
  let dx = 0;
  let dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (!dx && !dy) return null;
  return { x: dx, y: dy };
}

function blocks(pos: Position, r: number, buildings: Building[]): boolean {
  for (const b of buildings) {
    if (pos.x + r > b.x && pos.x - r < b.x + b.w && pos.y + r > b.y && pos.y - r < b.y + b.h) {
      return true;
    }
  }
  return false;
}

function moveWithCollision(
  pos: Position,
  dx: number,
  dy: number,
  r: number,
  buildings: Building[],
  city: CityWorld,
): void {
  if (dx) {
    const nx = pos.x + dx;
    if (!blocks({ x: nx, y: pos.y }, r, buildings)) pos.x = nx;
  }
  if (dy) {
    const ny = pos.y + dy;
    if (!blocks({ x: pos.x, y: ny }, r, buildings)) pos.y = ny;
  }
  pos.x = Math.max(16, Math.min(city.w - 16, pos.x));
  pos.y = Math.max(16, Math.min(city.h - 16, pos.y));
}

interface NavGraph {
  nodes: WorldPoint[];
  adj: Map<number, { to: number; w: number }[]>;
}

const GRAPH_CACHE = new WeakMap<CityWorld, NavGraph>();

function buildGraph(city: CityWorld): NavGraph {
  const nodes: WorldPoint[] = [];
  const index = new Map<string, number>();
  const adj = new Map<number, { to: number; w: number }[]>();

  const add = (p: WorldPoint): number => {
    const key = `${Math.round(p.x)},${Math.round(p.y)}`;
    const existing = index.get(key);
    if (existing !== undefined) return existing;
    const i = nodes.length;
    nodes.push({ x: p.x, y: p.y });
    index.set(key, i);
    adj.set(i, []);
    return i;
  };
  const link = (a: number, b: number): void => {
    const w = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    adj.get(a)!.push({ to: b, w });
    adj.get(b)!.push({ to: a, w });
  };

  for (const road of city.roads) {
    let prev = -1;
    for (const pt of road.points) {
      const i = add(pt);
      if (prev >= 0) link(prev, i);
      prev = i;
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d > 0 && d <= NODE_SNAP) link(i, j);
    }
  }
  return { nodes, adj };
}

function graphFor(city: CityWorld): NavGraph {
  let g = GRAPH_CACHE.get(city);
  if (!g) {
    g = buildGraph(city);
    GRAPH_CACHE.set(city, g);
  }
  return g;
}

function nearestNode(graph: NavGraph, p: WorldPoint): { index: number; dist: number } {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < graph.nodes.length; i++) {
    const d = Math.hypot(graph.nodes[i].x - p.x, graph.nodes[i].y - p.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, dist: bestD };
}

function dijkstra(graph: NavGraph, start: number, goal: number): number[] {
  const n = graph.nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const visited = new Array<boolean>(n).fill(false);
  dist[start] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < bestD) {
        bestD = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === goal) break;
    visited[u] = true;
    for (const edge of graph.adj.get(u) ?? []) {
      if (dist[u] + edge.w < dist[edge.to]) {
        dist[edge.to] = dist[u] + edge.w;
        prev[edge.to] = u;
      }
    }
  }

  if (dist[goal] === Infinity) return [];
  const out: number[] = [];
  for (let at = goal; at !== -1; at = prev[at]) out.push(at);
  return out.reverse();
}

export function findPath(city: CityWorld, from: Position, to: WorldPoint): Position[] {
  const graph = graphFor(city);
  if (graph.nodes.length === 0) return [to];
  const a = nearestNode(graph, from);
  const b = nearestNode(graph, to);
  if (a.index < 0 || b.index < 0 || a.dist > MAX_ATTACH || b.dist > MAX_ATTACH) {
    return [to];
  }
  const route = dijkstra(graph, a.index, b.index);
  if (route.length === 0) return [to];
  const pts: Position[] = route.map((i) => ({ x: graph.nodes[i].x, y: graph.nodes[i].y }));
  pts.push({ x: to.x, y: to.y });
  return pts;
}

export function setMoveTarget(p: PlayerRuntime, target: WorldPoint | null, city: CityWorld): void {
  if (!target) {
    p.moveTarget = null;
    p.path = null;
    return;
  }
  p.moveTarget = { x: target.x, y: target.y };
  p.path = findPath(city, p.pos, target);
}

export function stepPlayer(
  p: PlayerRuntime,
  dir: WorldPoint | null,
  dt: number,
  speed: number,
  city: CityWorld,
): void {
  const dist = speed * dt;

  if (dir && (dir.x !== 0 || dir.y !== 0)) {
    p.path = null;
    p.moveTarget = null;
    const len = Math.hypot(dir.x, dir.y) || 1;
    moveWithCollision(p.pos, (dir.x / len) * dist, (dir.y / len) * dist, PLAYER_RADIUS, city.buildings, city);
    p.walk += dt;
    return;
  }

  if (!p.path || p.path.length === 0) return;

  const next = p.path[0];
  const d = Math.hypot(next.x - p.pos.x, next.y - p.pos.y);
  if (d < WAYPOINT_EPS) {
    p.path.shift();
    if (p.path.length === 0) p.moveTarget = null;
    return;
  }

  const step = Math.min(dist, d);
  const beforeX = p.pos.x;
  const beforeY = p.pos.y;
  moveWithCollision(
    p.pos,
    ((next.x - p.pos.x) / d) * step,
    ((next.y - p.pos.y) / d) * step,
    PLAYER_RADIUS,
    city.buildings,
    city,
  );
  if (Math.hypot(p.pos.x - beforeX, p.pos.y - beforeY) < step * 0.25) {
    // Blocked — drop this waypoint so the player does not get stuck.
    p.path.shift();
    if (p.path.length === 0) p.moveTarget = null;
  }
  p.walk += dt;
}
