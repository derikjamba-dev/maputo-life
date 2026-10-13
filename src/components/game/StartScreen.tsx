"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  DEFAULT_LOOK,
  GENDER_LABELS,
  LOOK_LABELS,
  LOOK_VARIANTS,
  lookSwatch,
} from "@/lib/characterLooks";
import type { CharacterLook, Gender } from "@/types/game";

const CharacterPreview = dynamic(() => import("./CharacterPreview"), {
  ssr: false,
});

const GENDERS: Gender[] = ["male", "female"];

interface StartScreenProps {
  onStart: (name: string, look: CharacterLook) => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState("");
  const [look, setLook] = useState<CharacterLook>(DEFAULT_LOOK);

  const start = () => onStart(name.trim() || "Jogador", look);

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#0f2a3d] via-[#1a1410] to-[#2b1a0f] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 text-white shadow-2xl backdrop-blur">
        <div className="mb-1 text-4xl">🌴🚐🇲🇿</div>
        <h1 className="text-3xl font-black tracking-tight">Maputo Life</h1>
        <p className="mt-1 text-sm text-white/60">
          Um dia na cidade. Chapas, marrabenta, matapa e a brisa da baía.
        </p>

        <div className="mt-5 h-52 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <CharacterPreview look={look} />
        </div>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-white/50">
          O teu nome
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          maxLength={16}
          placeholder="Ex.: Nelo"
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-400/70 focus:bg-white/10"
        />

        <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Género
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g}
              onClick={() => setLook((l) => ({ ...l, gender: g }))}
              className="rounded-xl border px-3 py-2 text-sm font-medium transition"
              style={{
                borderColor: look.gender === g ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.12)",
                backgroundColor: look.gender === g ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
              }}
            >
              {GENDER_LABELS[g]}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Aparência
        </label>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {LOOK_VARIANTS.map((v) => {
            const swatch = lookSwatch({ gender: look.gender, variant: v });
            const active = look.variant === v;
            return (
              <button
                key={v}
                onClick={() => setLook((l) => ({ ...l, variant: v }))}
                title={LOOK_LABELS[v]}
                aria-label={LOOK_LABELS[v]}
                className="relative aspect-square overflow-hidden rounded-xl border-2 transition"
                style={{
                  backgroundColor: swatch.pants,
                  borderColor: active ? "white" : "transparent",
                  transform: active ? "scale(1.06)" : "scale(1)",
                }}
              >
                <div
                  className="absolute left-1/2 top-[15%] h-[26%] w-[34%] -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: swatch.hair }}
                />
                <div
                  className="absolute left-[18%] right-[18%] top-[38%] bottom-[20%] rounded-sm"
                  style={{ backgroundColor: swatch.shirt }}
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={start}
          className="mt-8 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 active:scale-[0.99]"
        >
          Começar a explorar
        </button>
      </div>
    </div>
  );
}
