"use client";

import { clamp, formatTime, weekday } from "@/lib/game";
import { lookSwatch } from "@/lib/characterLooks";
import type { CharacterLook, Stats } from "@/types/game";

interface HudProps {
  playerName: string;
  look: CharacterLook;
  day: number;
  minutes: number;
  stats: Stats;
  locationName: string | null;
  onSave: () => void;
  onNewGame: () => void;
}

function StatBar({
  label,
  value,
  from,
  to,
}: {
  label: string;
  value: number;
  from: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] uppercase tracking-wider text-white/60">
        {label}
      </span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${clamp(value, 0, 100)}%`,
            backgroundImage: `linear-gradient(90deg, ${from}, ${to})`,
          }}
        />
      </div>
    </div>
  );
}

export default function Hud({
  playerName,
  look,
  day,
  minutes,
  stats,
  locationName,
  onSave,
  onNewGame,
}: HudProps) {
  return (
    <header className="z-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-black/40 bg-[#1a1410]/95 px-4 py-2 text-white backdrop-blur">
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white shadow-inner"
          style={{ backgroundColor: lookSwatch(look).shirt }}
        >
          {playerName.slice(0, 1).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{playerName}</div>
          <div className="text-[11px] text-white/50">
            {locationName ?? "A caminhar…"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1">
        <span className="text-base">🕒</span>
        <div className="leading-tight">
          <div className="font-mono text-sm font-semibold tabular-nums">
            {formatTime(minutes)}
          </div>
          <div className="text-[10px] text-white/50">
            {weekday(day)} · Dia {day}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1">
        <span className="text-base">💰</span>
        <div className="leading-tight">
          <div className="font-mono text-sm font-semibold tabular-nums">
            {Math.round(stats.money)}
          </div>
          <div className="text-[10px] text-white/50">MZN</div>
        </div>
      </div>

      <div className="ml-auto flex flex-col gap-1">
        <StatBar label="Fome" value={stats.hunger} from="#fb923c" to="#f97316" />
        <StatBar label="Energia" value={stats.energy} from="#facc15" to="#84cc16" />
        <StatBar label="Diversão" value={stats.fun} from="#f472b6" to="#db2777" />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onSave}
          title="Guardar jogo"
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium transition hover:border-emerald-400/60 hover:bg-white/10"
        >
          💾 Guardar
        </button>
        <button
          onClick={onNewGame}
          title="Começar de novo"
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium transition hover:border-rose-400/60 hover:bg-white/10"
        >
          🔄 Novo
        </button>
      </div>
    </header>
  );
}
