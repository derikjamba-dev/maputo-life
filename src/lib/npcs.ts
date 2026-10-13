import { NPCS } from "@/data/npcs";
import type { Npc, NpcState, Position } from "@/types/game";

export const TALK_RADIUS = 90;

export const NPC_MAP: Map<string, Npc> = new Map(NPCS.map((npc) => [npc.id, npc]));

export function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function initNpcStates(): NpcState[] {
  return NPCS.map((npc) => ({
    id: npc.id,
    pos: { ...npc.home },
    target: { ...npc.home },
    wait: 0,
  }));
}

export function stepNpcs(states: NpcState[], dt: number): void {
  for (const s of states) {
    const def = NPC_MAP.get(s.id);
    if (!def) continue;
    if (s.wait > 0) {
      s.wait -= dt;
      continue;
    }
    const d = distance(s.pos, s.target);
    if (d < 4) {
      s.target = {
        x: def.patrol.x + Math.random() * def.patrol.w,
        y: def.patrol.y + Math.random() * def.patrol.h,
      };
      s.wait = 1 + Math.random() * 3;
      continue;
    }
    const step = Math.min(def.speed * dt, d);
    s.pos = {
      x: s.pos.x + ((s.target.x - s.pos.x) / d) * step,
      y: s.pos.y + ((s.target.y - s.pos.y) / d) * step,
    };
  }
}

export function nearestNpc(
  pos: Position,
  states: NpcState[],
  radius = TALK_RADIUS,
): NpcState | null {
  let best: NpcState | null = null;
  let bestD = radius;
  for (const s of states) {
    const d = distance(pos, s.pos);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
