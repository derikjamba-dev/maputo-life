import type { CharacterLook, Gender, LookVariant } from "@/types/game";

export const LOOK_VARIANTS: LookVariant[] = ["a", "b", "c", "d", "e", "f"];

export const LOOK_LABELS: Record<LookVariant, string> = {
  a: "Estilo A",
  b: "Estilo B",
  c: "Estilo C",
  d: "Estilo D",
  e: "Estilo E",
  f: "Estilo F",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Masculino",
  female: "Feminino",
};

export interface LookSwatch {
  hair: string;
  shirt: string;
  pants: string;
}

// Representative colours sampled from each character's baked atlas, used for the
// picker swatches (head = hair, body = shirt, legs = pants).
const SWATCHES: Record<string, LookSwatch> = {
  male_a: { hair: "#604c49", shirt: "#5ba577", pants: "#a68e8e" },
  male_b: { hair: "#cfa591", shirt: "#ec6f50", pants: "#a17e8e" },
  male_c: { hair: "#ae816d", shirt: "#998d8a", pants: "#4f4b52" },
  male_d: { hair: "#d78861", shirt: "#5f5356", pants: "#3d3d44" },
  male_e: { hair: "#b26d4e", shirt: "#f3cb91", pants: "#96816d" },
  male_f: { hair: "#725149", shirt: "#899170", pants: "#b0826d" },
  female_a: { hair: "#534748", shirt: "#9c68bb", pants: "#9e90ae" },
  female_b: { hair: "#d6845b", shirt: "#edae74", pants: "#7762a1" },
  female_c: { hair: "#8d777f", shirt: "#b5b1d0", pants: "#bc8779" },
  female_d: { hair: "#db8861", shirt: "#747990", pants: "#545665" },
  female_e: { hair: "#61514f", shirt: "#ded7e1", pants: "#7a7a89" },
  female_f: { hair: "#bf7452", shirt: "#ba8f5a", pants: "#7e77c5" },
};

export const DEFAULT_LOOK: CharacterLook = { gender: "male", variant: "a" };

export function lookKey(look: CharacterLook): string {
  return `${look.gender}_${look.variant}`;
}

export function lookSwatch(look: CharacterLook): LookSwatch {
  return SWATCHES[lookKey(look)] ?? SWATCHES.male_a;
}

export function isCharacterLook(value: unknown): value is CharacterLook {
  if (!value || typeof value !== "object") return false;
  const look = value as Partial<CharacterLook>;
  return (
    (look.gender === "male" || look.gender === "female") &&
    typeof look.variant === "string" &&
    (LOOK_VARIANTS as string[]).includes(look.variant)
  );
}
