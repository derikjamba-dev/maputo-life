"use client";

import type { TransportOption } from "@/types/game";

interface TransportPanelProps {
  options: TransportOption[];
  money: number;
  onTravel: (option: TransportOption) => void;
  onClose: () => void;
}

export default function TransportPanel({
  options,
  money,
  onTravel,
  onClose,
}: TransportPanelProps) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#12100c]/95 p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">🚏</span>
          <h2 className="text-lg font-bold">Transporte público</h2>
        </div>
        <p className="mb-4 text-xs text-white/50">
          Escolhe o destino. Chapas, carrinhas, motas e táxis ligam toda a
          cidade.
        </p>

        <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {options.map((opt) => {
            const affordable = money >= opt.cost;
            return (
              <button
                key={opt.id}
                disabled={!affordable}
                onClick={() => onTravel(opt)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-amber-400/60 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{opt.name}</div>
                  <div className="text-[11px] capitalize text-white/50">
                    {opt.mode} · ~{opt.minutes} min
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                  {opt.cost}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-medium transition hover:bg-white/20"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
