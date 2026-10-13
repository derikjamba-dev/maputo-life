import { LOCATIONS } from "@/data/locations";
import type { LocationId } from "@/types/game";
import type {
  Building,
  BuildingType,
  CityWorld,
  District,
  Prop,
  Road,
  WaterBody,
  WorldPoint,
} from "@/types/world";

export const WORLD = { w: 2400, h: 1600 };

export const CATEGORY_COLORS: Record<BuildingType, string> = {
  home: "#57b85d",
  food: "#ef8a3c",
  club: "#9b5de5",
  transport: "#3aa6d8",
  work: "#8a94a6",
};

export const CATEGORY_LABELS: Record<BuildingType, string> = {
  home: "Casa",
  food: "Comida",
  club: "Vida noturna",
  transport: "Chapa",
  work: "Trabalho",
};

const LOC_BY_ID = new Map(LOCATIONS.map((l) => [l.id, l]));

function makeBuilding(
  id: string,
  name: string,
  type: BuildingType,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { enterable?: boolean; label?: boolean; locationId?: LocationId } = {},
): Building {
  return {
    id,
    name,
    type,
    x,
    y,
    w,
    h,
    color: CATEGORY_COLORS[type],
    enterable: opts.enterable ?? false,
    label: opts.label ?? true,
    locationId: opts.locationId,
  };
}

function enterable(
  locationId: LocationId,
  type: BuildingType,
  x: number,
  y: number,
  w: number,
  h: number,
): Building {
  const loc = LOC_BY_ID.get(locationId);
  return makeBuilding(
    `loc-${locationId}`,
    loc?.name ?? locationId,
    type,
    x,
    y,
    w,
    h,
    { enterable: true, label: true, locationId },
  );
}

export const BUILDINGS: Building[] = [
  // Enterable landmarks (the 12 Maputo locations)
  enterable("baixa", "work", 700, 800, 140, 90),
  enterable("independencia", "food", 480, 780, 120, 90),
  enterable("cathedral", "work", 480, 340, 120, 90),
  enterable("mercado", "food", 720, 340, 150, 90),
  enterable("sommerschield", "work", 1160, 340, 150, 90),
  enterable("feima", "food", 1400, 340, 150, 100),
  enterable("costa-do-sol", "food", 1560, 150, 130, 100),
  enterable("natural-history", "work", 1160, 800, 150, 90),
  enterable("polana", "club", 1400, 800, 150, 90),
  enterable("tunduru", "club", 480, 1160, 120, 110),
  enterable("railway", "transport", 700, 1160, 160, 110),
  enterable("fortaleza", "work", 1560, 1160, 130, 110),

  // Alto Maé — residential homes
  makeBuilding("home-a", "Casa da Vila", "home", 80, 150, 90, 70),
  makeBuilding("home-b", "Casa da Tia Rosa", "home", 230, 150, 90, 70),
  makeBuilding("home-c", "Casa do Zé", "home", 340, 150, 80, 70),
  makeBuilding("home-d", "Vila do Xadrez", "home", 80, 390, 90, 70),
  makeBuilding("home-e", "Casa do Doutor", "home", 230, 390, 90, 70),
  makeBuilding("home-f", "Casa da Dona Mimí", "home", 340, 390, 80, 70),
  makeBuilding("home-g", "Pensão Sombra", "home", 80, 580, 90, 70),
  makeBuilding("home-h", "Casa do Pescador", "home", 230, 580, 90, 70),
  makeBuilding("home-i", "Vila Azul", "home", 340, 580, 80, 70),

  // Sommerschield — offices, cafes
  makeBuilding("work-a", "Edifício Acácias", "work", 980, 150, 110, 80),
  makeBuilding("work-b", "Escritórios Jat", "work", 1160, 150, 110, 80),
  makeBuilding("food-a", "Café Sommerschield", "food", 1400, 150, 110, 80),
  makeBuilding("work-c", "Banco Comercial", "work", 980, 390, 110, 80),
  makeBuilding("work-d", "Sede Imparcial", "work", 1160, 560, 110, 80),
  makeBuilding("food-b", "Pastelaria Colina", "food", 1400, 560, 110, 80),

  // Baixa — downtown work, markets, transport
  makeBuilding("work-e", "Edifício Central", "work", 80, 790, 90, 80),
  makeBuilding("work-f", "Torre do Porto", "work", 230, 790, 90, 80),
  makeBuilding("work-g", "Ministério", "work", 340, 790, 90, 80),
  makeBuilding("work-h", "Gabinete Aduaneiro", "work", 80, 1000, 90, 70),
  makeBuilding("food-c", "Cantina da Baixa", "food", 720, 1000, 120, 70),
  makeBuilding("transport-a", "Terminal da Baixa", "transport", 80, 1180, 110, 80),
  makeBuilding("work-i", "Seguradora Índico", "work", 230, 1180, 100, 80),
  makeBuilding("work-j", "Cartório", "work", 340, 1180, 80, 80),

  // Polana — clubs, transport
  makeBuilding("club-a", "Clube Costa Azul", "club", 980, 790, 110, 90),
  makeBuilding("club-b", "Bar do Jazz", "club", 1160, 1000, 110, 90),
  makeBuilding("club-c", "Discoteca Oásis", "club", 1400, 1000, 110, 90),
  makeBuilding("transport-b", "Paragem da Polana", "transport", 980, 1180, 110, 80),
  makeBuilding("work-k", "Hotel Panorama", "work", 1160, 1180, 110, 80),
];

// Grid used for the road network and city blocks.
export const GRID_X = [200, 440, 620, 920, 1120, 1320, 1700, 1800];
export const GRID_Y = [120, 300, 520, 730, 900, 1080, 1320];

const V_NAMES: Record<number, string> = {
  200: "Av. de Moçambique",
  440: "Av. Vladimir Lenine",
  620: "Av. Guerra Popular",
  920: "Av. Julius Nyerere",
  1120: "Av. Eduardo Mondlane",
  1320: "Av. Angola",
  1700: "Av. 10 de Novembro",
  1800: "Av. Marginal",
};

const H_NAMES: Record<number, string> = {
  120: "Av. da Independência",
  300: "Av. Ahmed Sekou Touré",
  520: "Av. Fernão Mendes Pinto",
  730: "Av. 25 de Setembro",
  900: "Av. Zedequias Manganhela",
  1080: "Av. 24 de Julho",
  1320: "Av. Acordos de Lusaka",
};

const V_LANES: Record<number, number> = {
  200: 2,
  440: 2,
  620: 2,
  920: 4,
  1120: 2,
  1320: 2,
  1700: 2,
  1800: 2,
};

const H_LANES: Record<number, number> = {
  120: 2,
  300: 4,
  520: 2,
  730: 4,
  900: 2,
  1080: 2,
  1320: 2,
};

export const ROADS: Road[] = [
  ...GRID_X.map((x) => ({
    id: `v-${x}`,
    name: V_NAMES[x] ?? "Rua sem nome",
    lanes: V_LANES[x] ?? 2,
    points: [
      { x, y: 60 },
      ...GRID_Y.map((y) => ({ x, y })),
      { x, y: 1460 },
    ],
  })),
  ...GRID_Y.map((y) => ({
    id: `h-${y}`,
    name: H_NAMES[y] ?? "Rua sem nome",
    lanes: H_LANES[y] ?? 2,
    points: [
      { x: 60, y },
      ...GRID_X.map((x) => ({ x, y })),
      { x: 1840, y },
    ],
  })),
];

export const DISTRICTS: District[] = [
  {
    id: "alto-mae",
    name: "Alto Maé",
    color: "#d9c48a",
    polygon: [
      { x: 40, y: 40 },
      { x: 900, y: 40 },
      { x: 900, y: 720 },
      { x: 700, y: 730 },
      { x: 40, y: 730 },
    ],
  },
  {
    id: "sommerschield",
    name: "Sommerschield",
    color: "#a8cf8f",
    polygon: [
      { x: 940, y: 40 },
      { x: 1850, y: 40 },
      { x: 1850, y: 720 },
      { x: 1120, y: 730 },
      { x: 940, y: 730 },
    ],
  },
  {
    id: "baixa",
    name: "Baixa",
    color: "#e3b98a",
    polygon: [
      { x: 40, y: 750 },
      { x: 800, y: 750 },
      { x: 900, y: 760 },
      { x: 900, y: 1500 },
      { x: 40, y: 1500 },
    ],
  },
  {
    id: "polana",
    name: "Polana",
    color: "#e0a98c",
    polygon: [
      { x: 920, y: 750 },
      { x: 1850, y: 750 },
      { x: 1850, y: 1500 },
      { x: 1000, y: 1500 },
      { x: 940, y: 900 },
    ],
  },
];

export const WATER: WaterBody = {
  points: [
    { x: 1860, y: -60 },
    { x: 2460, y: -60 },
    { x: 2460, y: 1660 },
    { x: 1990, y: 1660 },
    { x: 1960, y: 1360 },
    { x: 2010, y: 1040 },
    { x: 1930, y: 760 },
    { x: 1980, y: 420 },
    { x: 1880, y: 140 },
  ],
};

function palmsAlongCoast(): Prop[] {
  const out: Prop[] = [];
  for (let y = 220; y <= 1320; y += 150) out.push({ kind: "palm", x: 1830, y });
  return out;
}

export const PROPS: Prop[] = [
  ...palmsAlongCoast(),
  { kind: "palm", x: 640, y: 1230 },
  { kind: "palm", x: 660, y: 1200 },
  { kind: "tree", x: 1040, y: 300 },
  { kind: "tree", x: 1240, y: 470 },
  { kind: "tree", x: 1500, y: 300 },
  { kind: "tree", x: 1040, y: 1400 },
  { kind: "kiosk", x: 700, y: 470 },
  { kind: "kiosk", x: 640, y: 1000 },
  { kind: "chapa", x: 140, y: 1230 },
  { kind: "chapa", x: 1030, y: 1240 },
  { kind: "chapa", x: 780, y: 1290 },
  { kind: "traffic", x: 920, y: 730 },
  { kind: "traffic", x: 440, y: 730 },
  { kind: "traffic", x: 1320, y: 730 },
  { kind: "traffic", x: 920, y: 300 },
  { kind: "traffic", x: 920, y: 1080 },
  { kind: "boat", x: 2120, y: 520 },
  { kind: "boat", x: 2200, y: 900 },
  { kind: "boat", x: 2060, y: 1200 },
];

export const CITY: CityWorld = {
  w: WORLD.w,
  h: WORLD.h,
  water: WATER,
  districts: DISTRICTS,
  roads: ROADS,
  buildings: BUILDINGS,
  props: PROPS,
};

// Where a traveller arrives / stands when entering each locations.
export const LOCATION_ANCHORS: Partial<Record<LocationId, WorldPoint>> = {};
for (const b of BUILDINGS) {
  if (b.locationId) {
    LOCATION_ANCHORS[b.locationId] = { x: b.x + b.w / 2, y: b.y + b.h + 26 };
  }
}

export const START_POSITION: WorldPoint = { x: 920, y: 770 };

export function getLocationAtBuilding(pos: WorldPoint): LocationId | null {
  for (const b of BUILDINGS) {
    if (!b.locationId) continue;
    if (pos.x < b.x - 24 || pos.x > b.x + b.w + 24) continue;
    if (pos.y < b.y - 24 || pos.y > b.y + b.h + 36) continue;
    return b.locationId;
  }
  return null;
}

export function buildingAt(x: number, y: number): Building | null {
  for (let i = BUILDINGS.length - 1; i >= 0; i--) {
    const b = BUILDINGS[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

export function locationCenter(id: LocationId): WorldPoint {
  const anchor = LOCATION_ANCHORS[id];
  if (anchor) return anchor;
  const b = BUILDINGS.find((x) => x.locationId === id);
  if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  return { x: WORLD.w / 2, y: WORLD.h / 2 };
}
