"use client";

import { useEffect } from "react";

import type { Npc } from "@/types/game";

interface DialogueProps {
  npc: Npc;
  line: string;
  onNext: () => void;
  onClose: () => void;
}

export default function Dialogue({
  npc,
  line,
  onNext,
  onClose,
}: DialogueProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key.toLowerCase() === "e" || e.key === "Enter") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onClose]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-2xl border border-white/15 bg-[#12100c]/95 p-4 text-white shadow-2xl backdrop-blur">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white text-xl"
          style={{ backgroundColor: npc.color }}
        >
          {npc.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-amber-300">{npc.name}</div>
          <p className="mt-0.5 text-sm leading-snug text-white/90">{line}</p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-white/50">
            <button
              onClick={onNext}
              className="rounded-full bg-white/10 px-3 py-1 font-medium text-white transition hover:bg-white/20"
            >
              Falar mais
            </button>
            <button
              onClick={onClose}
              className="rounded-full px-3 py-1 font-medium text-white/70 transition hover:text-white"
            >
              Despedir-se
            </button>
            <span className="ml-auto">
              <kbd className="rounded bg-white/15 px-1.5 font-mono">E</kbd> continuar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
