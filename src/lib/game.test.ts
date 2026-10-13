import { describe, expect, it } from "vitest";

import { LOCATIONS } from "@/data/locations";
import {
  applyEffects,
  canAfford,
  getTransportOptions,
  clamp,
} from "@/lib/game";
import type { Stats } from "@/types/game";

describe("clamp", () => {
  it("clamps values within range", () => {
    expect(clamp(-10, 0, 5)).toBe(0);
    expect(clamp(2, 0, 5)).toBe(2);
    expect(clamp(10, 0, 5)).toBe(5);
  });
});

describe("applyEffects", () => {
  const stats: Stats = { money: 100, hunger: 50, energy: 50, fun: 50 };

  it("applies money/hunger/energy/fun effects", () => {
    const action = {
      id: "x",
      label: "x",
      emoji: "x",
      effect: { money: -25, hunger: 40, energy: -10, fun: 15 },
      message: "msg",
    };
    expect(applyEffects(stats, action)).toEqual({
      money: 75,
      hunger: 90,
      energy: 40,
      fun: 65,
    });
  });

  it("clamps stats and ignores missing effects", () => {
    const action = { id: "x", label: "x", emoji: "x", message: "msg" };
    const base: Stats = { money: 0, hunger: 95, energy: 5, fun: 95 };
    expect(applyEffects(base, { ...action, effect: { hunger: 100, energy: -100 } })).toEqual({
      money: 0,
      hunger: 100,
      energy: 0,
      fun: 95,
    });
  });
});

describe("canAfford", () => {
  it("checks money against action cost", () => {
    const stats: Stats = { money: 50, hunger: 0, energy: 0, fun: 0 };
    expect(canAfford(stats, { id: "a", label: "a", emoji: "a", cost: 50, message: "m" })).toBe(true);
    expect(canAfford(stats, { id: "a", label: "a", emoji: "a", cost: 51, message: "m" })).toBe(false);
  });
});

describe("getTransportOptions", () => {
  it("excludes current location and sorts by distance", () => {
    const from = "baixa";
    const pos = { x: 700, y: 800 };
    const options = getTransportOptions(from, pos);

    expect(options.length).toBe(LOCATIONS.length - 1);
    expect(options.some((option) => option.id === from)).toBe(false);
    for (let i = 1; i < options.length; i++) {
      expect(options[i - 1].distance).toBeLessThanOrEqual(options[i].distance);
    }
  });

  it("uses valid modes and positive costs", () => {
    const options = getTransportOptions(null, { x: 0, y: 0 });
    expect(options.every((option) => ["mota", "chapa", "carrinha", "taxi"].includes(option.mode))).toBe(true);
    expect(options.every((option) => option.cost > 0 && option.minutes > 0)).toBe(true);
  });
});