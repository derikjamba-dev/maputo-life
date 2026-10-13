export type LocationId =
  | "baixa"
  | "independencia"
  | "cathedral"
  | "fortaleza"
  | "railway"
  | "mercado"
  | "tunduru"
  | "costa-do-sol"
  | "feima"
  | "polana"
  | "sommerschield"
  | "natural-history";

export interface Position {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ActionEffect = Partial<{
  money: number;
  hunger: number;
  energy: number;
  fun: number;
}>;

export interface GameAction {
  id: string;
  label: string;
  emoji: string;
  cost?: number;
  effect?: ActionEffect;
  message: string;
}

export interface GameLocation {
  id: LocationId;
  name: string;
  description: string;
  color: string;
  rect: Rect;
  actions: GameAction[];
}

export interface Stats {
  money: number;
  hunger: number;
  energy: number;
  fun: number;
}

export interface Npc {
  id: string;
  name: string;
  emoji: string;
  color: string;
  home: Position;
  patrol: Rect;
  speed: number;
  lines: string[];
}

export interface NpcState {
  id: string;
  pos: Position;
  target: Position;
  wait: number;
}

export type Gender = "male" | "female";

export type LookVariant = "a" | "b" | "c" | "d" | "e" | "f";

export interface CharacterLook {
  gender: Gender;
  variant: LookVariant;
}

export type TransportMode = "mota" | "chapa" | "taxi" | "carrinha";

export interface TransportOption {
  id: LocationId;
  name: string;
  mode: TransportMode;
  emoji: string;
  cost: number;
  minutes: number;
  distance: number;
}

export interface SaveData {
  version: 1;
  playerName: string;
  look?: CharacterLook;
  pos: Position;
  minutes: number;
  day: number;
  stats: Stats;
  log: string[];
}

export interface GameRuntime {
  playerName: string;
  look: CharacterLook;
  pos: Position;
  minutes: number;
  day: number;
  stats: Stats;
  currentLocation: LocationId | null;
  log: string[];
  npcs: NpcState[];
  path: Position[] | null;
  moveTarget: Position | null;
  walk: number;
  keys: Set<string>;
  busy: boolean;
}
