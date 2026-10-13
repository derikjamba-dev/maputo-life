export type Surface = "matte" | "flat" | "metal" | "satin";

export interface SurfaceProps {
  roughness: number;
  metalness: number;
}

export const SURFACES: Record<Surface, SurfaceProps> = {
  matte: { roughness: 0.92, metalness: 0 },
  flat: { roughness: 1, metalness: 0 },
  metal: { roughness: 0.35, metalness: 0.75 },
  satin: { roughness: 0.55, metalness: 0.1 },
};

export const PALETTE = {
  ground: "#7f9e57",
  groundDark: "#6d8b49",
  sand: "#d9c48a",
  water: "#3f7fb2",
  waterDeep: "#2f6a9c",
  road: "#8b8f96",
  roadEdge: "#7a7e85",
  roadLine: "#efe9d6",
  sidewalk: "#c9c2ad",

  leaf: "#4f9a3c",
  leafDark: "#3c8434",
  bush: "#4d8f3a",
  trunk: "#7a5a3a",
  palmTrunk: "#8a6a45",
  palmLeaf: "#3f9b4a",

  wood: "#9a6b43",
  mud: "#b5784a",
  thatch: "#c99a52",
  roofRed: "#b45a3c",
  roofTile: "#9a4b33",
  roofTin: "#a3abb4",
  wall: "#e5e7eb",
  wallWarm: "#e7d6bc",
  granite: "#8d8172",
  graniteLight: "#a39684",
  graniteDark: "#6c6156",

  lamp: "#f4d778",
  boat: "#c96a3a",
  boatTrim: "#e8dcc4",
} as const;

export const SKY = {
  day: "#bfe0f5",
  fog: "#cfe3ee",
  night: "#0b1026",
} as const;
