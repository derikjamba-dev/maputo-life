"use client";

import { canAfford } from "@/lib/game";
import type { GameAction, GameLocation, Stats } from "@/types/game";

interface ActionPanelProps {
  location: GameLocation | null;
  stats: Stats;
  log: string[];
  onAction: (action: GameAction) => void;
  onTransport: () => void;
  onSleep: () => void;
}

function GlobalButton({
  emoji,
  label,
  hint,
  onClick,
}: {
  emoji: string;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-amber-400/20"
    >
      <span className="text-lg">{emoji}</span>
      <span className="font-medium">{label}</span>
      <span className="ml-1 text-[11px] text-white/50">{hint}</span>
    </button>
  );
}

export default function ActionPanel({
  location,
  stats,
  log,
  onAction,
  onTransport,
  onSleep,
}: ActionPanelProps) {
  return (
    <section className="z-20 grid gap-4 border-t border-black/40 bg-[#1a1410]/95 p-4 text-white backdrop-blur md:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-3">
        {location ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: location.color }}
              />
              <h2 className="text-sm font-bold">{location.name}</h2>
              <span className="hidden text-xs text-white/50 sm:inline">
                · {location.description}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {location.actions.map((action) => {
                const affordable = canAfford(stats, action);
                return (
                  <button
                    key={action.id}
                    onClick={() => onAction(action)}
                    disabled={!affordable}
                    className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm transition enabled:hover:-translate-y-0.5 enabled:hover:border-amber-400/60 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-lg">{action.emoji}</span>
                    <span className="font-medium">{action.label}</span>
                    {action.cost ? (
                      <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                        {action.cost} MZN
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="text-2xl">🧭</span>
            <p>
              Estás a deambular pela cidade. Aproxima-te de um local para
              interagir.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <GlobalButton
            emoji="🚐"
            label="Transporte"
            hint="viajar pela cidade"
            onClick={onTransport}
          />
          <GlobalButton
            emoji="🛏️"
            label="Dormir"
            hint="até de manhã"
            onClick={onSleep}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
          Caderno
        </div>
        <ul className="flex flex-col gap-1.5" aria-live="polite" aria-atomic="true">
          {log.length === 0 && (
            <li className="text-xs text-white/40">Sem novidades ainda…</li>
          )}
          {log.map((entry, i) => (
            <li
              key={`${i}-${entry}`}
              className="text-xs leading-snug text-white/80"
              style={{ opacity: 1 - i * 0.14 }}
            >
              <span className="mr-1 text-amber-400/70">›</span>
              {entry}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
