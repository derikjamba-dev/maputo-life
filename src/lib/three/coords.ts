import { WORLD } from "@/lib/world";

export const WORLD_CENTER_X = WORLD.w / 2;
export const WORLD_CENTER_Z = WORLD.h / 2;

export const WORLD_W = WORLD.w;
export const WORLD_D = WORLD.h;

export function toX(x: number): number {
  return x - WORLD_CENTER_X;
}

export function toZ(y: number): number {
  return y - WORLD_CENTER_Z;
}

export function to3(x: number, y: number, h = 0): [number, number, number] {
  return [x - WORLD_CENTER_X, h, y - WORLD_CENTER_Z];
}
