import type { Position, SaveData, Stats } from "@/types/game";

import { DEFAULT_LOOK, isCharacterLook } from "@/lib/characterLooks";
import { START_POSITION } from "@/lib/world";

const STORAGE_KEY = "maputo-life:save:v1";
const DAY_MINUTES = 1440;
const MAX_LOG_ENTRIES = 6;
const INITIAL_STATS: Stats = { money: 500, hunger: 70, energy: 80, fun: 60 };

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const pos = value as Partial<Position>;
  return (
    typeof pos.x === "number" &&
    Number.isFinite(pos.x) &&
    typeof pos.y === "number" &&
    Number.isFinite(pos.y)
  );
}

function finiteOrDefault(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeStats(value: unknown): Stats {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<Stats>;
  return {
    money: Math.round(finiteOrDefault(raw.money, INITIAL_STATS.money, 0, 1_000_000_000)),
    hunger: finiteOrDefault(raw.hunger, INITIAL_STATS.hunger, 0, 100),
    energy: finiteOrDefault(raw.energy, INITIAL_STATS.energy, 0, 100),
    fun: finiteOrDefault(raw.fun, INITIAL_STATS.fun, 0, 100),
  };
}

function normalizePlayerName(value: unknown): string {
  if (typeof value !== "string") return "Jogador";
  const trimmed = value.trim().slice(0, 16);
  return trimmed || "Jogador";
}

function normalizeLog(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.slice(0, 240))
    .slice(0, MAX_LOG_ENTRIES);
}

function normalizeSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (data.version !== 1) return null;

  return {
    version: 1,
    playerName: normalizePlayerName(data.playerName),
    look: isCharacterLook(data.look) ? data.look : { ...DEFAULT_LOOK },
    pos: isPosition(data.pos) ? data.pos : { ...START_POSITION },
    minutes: finiteOrDefault(data.minutes, 8 * 60, 0, DAY_MINUTES - 1),
    day: finiteOrDefault(data.day, 1, 1, 100000),
    stats: normalizeStats(data.stats),
    log: normalizeLog(data.log),
  };
}

function normalizeForStorage(data: SaveData): SaveData {
  return {
    version: 1,
    playerName: normalizePlayerName(data.playerName),
    look: isCharacterLook(data.look) ? data.look : { ...DEFAULT_LOOK },
    pos: isPosition(data.pos) ? data.pos : { ...START_POSITION },
    minutes: finiteOrDefault(data.minutes, 8 * 60, 0, DAY_MINUTES - 1),
    day: finiteOrDefault(data.day, 1, 1, 100000),
    stats: normalizeStats(data.stats),
    log: normalizeLog(data.log),
  };
}

export function saveGame(data: SaveData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeForStorage(data)));
  } catch {
    // ignore storage errors
  }
}

export function loadGame(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return normalizeSave(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}