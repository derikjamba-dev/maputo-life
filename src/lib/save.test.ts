/// <reference types="vitest/globals" />
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearSave, loadGame, saveGame } from "@/lib/save";
import { DEFAULT_LOOK } from "@/lib/characterLooks";
import type { SaveData } from "@/types/game";

const saveData: SaveData = {
  version: 1,
  playerName: "Nelo",
  look: { gender: "female", variant: "c" },
  pos: { x: 120, y: 300 },
  minutes: 8 * 60,
  day: 3,
  stats: { money: 123.4, hunger: 80, energy: 60, fun: 40 },
  log: ["hello", "world"],
};

describe("saveGame/loadGame", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("round trips valid save data", () => {
    saveGame(saveData);
    const loaded = loadGame();

    expect(loaded).not.toBeNull();
    expect(loaded?.playerName).toBe("Nelo");
    expect(loaded?.look).toEqual(saveData.look);
    expect(loaded?.pos).toEqual(saveData.pos);
    expect(loaded?.day).toBe(3);
    expect(loaded?.stats.money).toBe(123);
    expect(loaded?.log).toEqual(saveData.log);
  });

  it("sanitizes invalid localStorage payloads", () => {
    localStorage.setItem("maputo-life:save:v1", JSON.stringify({ version: 1, playerName: "", pos: "bad" }));

    const loaded = loadGame();
    expect(loaded?.playerName).toBe("Jogador");
    expect(loaded?.pos).toEqual({ x: 920, y: 770 });
    expect(loaded?.look).toEqual(DEFAULT_LOOK);
  });

  it("rejects unsupported versions", () => {
    localStorage.setItem("maputo-life:save:v1", JSON.stringify({ version: 2 }));
    expect(loadGame()).toBeNull();
  });

  it("clears save data", () => {
    saveGame(saveData);
    clearSave();
    expect(loadGame()).toBeNull();
  });
});