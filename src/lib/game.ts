import { LOCATIONS } from "@/data/locations";
import { LOCATION_ANCHORS } from "@/lib/world";
import type {
  GameAction,
  GameLocation,
  LocationId,
  Position,
  Stats,
  TransportMode,
  TransportOption,
} from "@/types/game";

export { TALK_RADIUS, distance, initNpcStates, nearestNpc, stepNpcs } from "@/lib/npcs";

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const TRANSPORT_MODES: Record<
  TransportMode,
  { emoji: string; base: number; label: string }
> = {
  mota: { emoji: "🛵", base: 40, label: "mota" },
  chapa: { emoji: "🚐", base: 20, label: "chapa" },
  carrinha: { emoji: "🚌", base: 35, label: "carrinha" },
  taxi: { emoji: "🚕", base: 130, label: "táxi" },
};

function destinationOf(id: LocationId): Position {
  const anchor = LOCATION_ANCHORS[id];
  if (anchor) return { x: anchor.x, y: anchor.y };
  const loc = LOCATIONS.find((l) => l.id === id);
  if (loc) return { x: loc.rect.x + loc.rect.w / 2, y: loc.rect.y + loc.rect.h / 2 };
  return { x: 0, y: 0 };
}

export function getTransportOptions(
  from: LocationId | null,
  pos: Position,
): TransportOption[] {
  return LOCATIONS.filter((loc) => loc.id !== from)
    .map((loc) => {
      const dest = destinationOf(loc.id);
      const dist = Math.hypot(pos.x - dest.x, pos.y - dest.y);
      const mode: TransportMode =
        dist < 420 ? "mota" : dist < 950 ? "chapa" : dist < 1500 ? "carrinha" : "taxi";
      const { emoji, base } = TRANSPORT_MODES[mode];
      const cost = Math.max(15, Math.round((base + dist * 0.02) / 5) * 5);
      const minutes = Math.max(2, Math.round(dist / 380) + 3);
      return {
        id: loc.id,
        name: loc.name,
        mode,
        emoji,
        cost,
        minutes,
        distance: Math.round(dist),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

export function getDaylight(minutes: number): {
  color: string;
  opacity: number;
} {
  const h = (((minutes % 1440) + 1440) % 1440) / 60;
  if (h < 4.5 || h >= 21) return { color: "#0b1026", opacity: 0.58 };
  if (h < 6.5) return { color: "#1b2a54", opacity: 0.32 };
  if (h < 8) return { color: "#f2a35e", opacity: 0.16 };
  if (h < 16.5) return { color: "#000000", opacity: 0 };
  if (h < 18.5) return { color: "#e07a34", opacity: 0.2 };
  return { color: "#2a1b46", opacity: 0.42 };
}

const WEEKDAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

export function formatTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function weekday(day: number): string {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length];
}

export function getLocationAt(
  pos: Position,
  locations: GameLocation[] = LOCATIONS,
): GameLocation | null {
  for (const loc of locations) {
    const { x, y, w, h } = loc.rect;
    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
      return loc;
    }
  }
  return null;
}

export function applyEffects(stats: Stats, action: GameAction): Stats {
  const e = action.effect ?? {};
  return {
    money: Math.round(stats.money + (e.money ?? 0)),
    hunger: clamp(stats.hunger + (e.hunger ?? 0), 0, 100),
    energy: clamp(stats.energy + (e.energy ?? 0), 0, 100),
    fun: clamp(stats.fun + (e.fun ?? 0), 0, 100),
  };
}

export function canAfford(stats: Stats, action: GameAction): boolean {
  return stats.money >= (action.cost ?? 0);
}
