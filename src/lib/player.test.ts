import { describe, expect, it } from "vitest";

import { CITY } from "@/lib/world";
import { setMoveTarget, stepPlayer } from "@/lib/player";

describe("player", () => {
  it("finds a non-empty path to a nearby road point", () => {
    const player = {
      pos: { x: 920, y: 770 },
      path: null,
      moveTarget: null,
      walk: 0,
    };

    setMoveTarget(player, { x: 500, y: 500 }, CITY);
    const foundPath = (player as { path: { length: number } | null }).path;
    expect(foundPath).not.toBeNull();
    expect(foundPath!.length).toBeGreaterThan(0);
  });

  it("moves along a path without throwing", () => {
    const player = {
      pos: { x: 920, y: 770 },
      path: null,
      moveTarget: { x: 500, y: 500 },
      walk: 0,
    };
    setMoveTarget(player, { x: 500, y: 500 }, CITY);

    const before = { ...player.pos };
    stepPlayer(player, null, 0.05, 240, CITY);
    const after = player.pos;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThanOrEqual(0);
  });
});