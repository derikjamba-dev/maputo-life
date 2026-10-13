import type { LocationId } from "@/types/game";

export interface WorldPoint {
  x: number;
  y: number;
}

export type BuildingType = "home" | "food" | "club" | "transport" | "work";

export interface MassingBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  height: number;
}

export interface Building {
  id: string;
  name: string;
  type: BuildingType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  enterable: boolean;
  label: boolean;
  locationId?: LocationId;
  massing?: MassingBlock[];
}

export interface Road {
  id: string;
  name: string;
  lanes: number;
  points: WorldPoint[];
}

export interface District {
  id: string;
  name: string;
  color: string;
  polygon: WorldPoint[];
}

export type PropKind =
  | "palm"
  | "tree"
  | "kiosk"
  | "chapa"
  | "traffic"
  | "boat";

export interface Prop {
  kind: PropKind;
  x: number;
  y: number;
}

export interface WaterBody {
  points: WorldPoint[];
}

export interface CityWorld {
  w: number;
  h: number;
  water: WaterBody;
  districts: District[];
  roads: Road[];
  buildings: Building[];
  props: Prop[];
}
