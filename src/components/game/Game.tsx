"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { LOCATIONS, PLAYER_SPEED } from "@/data/locations";
import { NPCS } from "@/data/npcs";
import { DEFAULT_LOOK, isCharacterLook } from "@/lib/characterLooks";
import {
  applyEffects,
  canAfford,
  clamp,
  getTransportOptions,
  initNpcStates,
  nearestNpc,
  stepNpcs,
} from "@/lib/game";
import { intentFromKeys, setMoveTarget, stepPlayer } from "@/lib/player";
import { clearSave, loadGame, saveGame } from "@/lib/save";
import { CITY, getLocationAtBuilding, locationCenter, START_POSITION } from "@/lib/world";
import type {
  CharacterLook,
  GameAction,
  GameRuntime,
  Stats,
  TransportOption,
} from "@/types/game";
import type { Building } from "@/types/world";

import ActionPanel from "./ActionPanel";
import Dialogue from "./Dialogue";
import Hud from "./Hud";
import StartScreen from "./StartScreen";
import TransportPanel from "./TransportPanel";

const Map3D = dynamic(() => import("./Map3D"), { ssr: false });

const INITIAL_STATS: Stats = { money: 500, hunger: 70, energy: 80, fun: 60 };

interface DialogueState {
  npcId: string;
  line: string;
}

const MOVE_KEYS = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
  " ",
];

function makeRuntime(): GameRuntime {
  return {
    playerName: "Jogador",
    look: { ...DEFAULT_LOOK },
    pos: { ...START_POSITION },
    minutes: 8 * 60,
    day: 1,
    stats: { ...INITIAL_STATS },
    currentLocation: null,
    log: ["Bem-vindo a Maputo! Toca no mapa para andar pela cidade."],
    npcs: initNpcStates(),
    path: null,
    moveTarget: null,
    walk: 0,
    keys: new Set<string>(),
    busy: false,
  };
}

export default function Game() {
  const [started, setStarted] = useState(false);
  const [view, setView] = useState<GameRuntime>(makeRuntime);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [showTransport, setShowTransport] = useState(false);

  const rt = useRef<GameRuntime>(makeRuntime());
  const lastSync = useRef(0);

  const sync = useCallback(() => setView({ ...rt.current }), []);

  const talk = useCallback((npcId: string) => {
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return;
    const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
    setDialogue({ npcId, line });
  }, []);

  const handleStart = useCallback(
    (name: string, look: CharacterLook) => {
      rt.current.playerName = name;
      rt.current.look = look;
      sync();
      setStarted(true);
    },
    [sync],
  );

  const handleEnter = useCallback(
    (building: Building) => {
      const g = rt.current;
      g.log = [`Entering ${building.name}`, ...g.log].slice(0, 6);
      if (building.enterable) {
        setMoveTarget(g, { x: building.x + building.w / 2, y: building.y + building.h + 30 }, CITY);
      }
      if (typeof window !== "undefined") {
        console.log(`Entering ${building.name}`);
      }
      sync();
    },
    [sync],
  );

  const handleAction = useCallback(
    (action: GameAction) => {
      const g = rt.current;
      if (!canAfford(g.stats, action)) return;
      let next: Stats = { ...g.stats };
      if (action.cost) next.money -= action.cost;
      next = applyEffects(next, action);
      g.stats = next;
      g.log = [action.message, ...g.log].slice(0, 6);
      sync();
    },
    [sync],
  );

  const handleSleep = useCallback(() => {
    const g = rt.current;
    const cur = (((g.minutes % 1440) + 1440) % 1440);
    const add = cur < 420 ? 420 - cur : 1440 - cur + 420;
    const total = (g.day - 1) * 1440 + cur + add;
    g.day = Math.floor(total / 1440) + 1;
    g.minutes = total % 1440;
    g.stats = {
      ...g.stats,
      energy: 100,
      hunger: clamp(g.stats.hunger - 25, 0, 100),
    };
    g.log = ["Dormiste bem até de manhã. Energia a 100%.", ...g.log].slice(0, 6);
    sync();
  }, [sync]);

  const handleTravel = useCallback(
    (option: TransportOption) => {
      const g = rt.current;
      const loc = LOCATIONS.find((l) => l.id === option.id);
      if (!loc || g.stats.money < option.cost) return;
      const total = (g.day - 1) * 1440 + g.minutes + option.minutes;
      g.day = Math.floor(total / 1440) + 1;
      g.minutes = total % 1440;
      g.stats = {
        ...g.stats,
        money: g.stats.money - option.cost,
        energy: clamp(g.stats.energy - 3, 0, 100),
      };
      g.pos = locationCenter(loc.id);
      g.path = null;
      g.moveTarget = null;
      g.currentLocation = loc.id;
      g.log = [
        `Viajaste de ${option.mode} até ${loc.name} (${option.cost} MZN).`,
        ...g.log,
      ].slice(0, 6);
      setShowTransport(false);
      sync();
    },
    [sync],
  );

  const handleSave = useCallback(() => {
    const g = rt.current;
    saveGame({
      version: 1,
      playerName: g.playerName,
      look: g.look,
      pos: g.pos,
      minutes: g.minutes,
      day: g.day,
      stats: g.stats,
      log: g.log,
    });
    g.log = ["Jogo guardado.", ...g.log].slice(0, 6);
    sync();
  }, [sync]);

  const handleNewGame = useCallback(() => {
    clearSave();
    rt.current = makeRuntime();
    setDialogue(null);
    setShowTransport(false);
    sync();
    setStarted(false);
  }, [sync]);

  const dialogueNext = useCallback(() => {
    setDialogue((d) => {
      if (!d) return d;
      const npc = NPCS.find((n) => n.id === d.npcId);
      if (!npc) return d;
      let line = d.line;
      for (let i = 0; i < 6 && line === d.line; i++) {
        line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
      }
      return { npcId: d.npcId, line };
    });
  }, []);

  const onFrame = useCallback((dt: number) => {
    const g = rt.current;
    if (!g.busy) {
      const dir = intentFromKeys(g.keys);
      stepPlayer(g, dir, dt, PLAYER_SPEED, CITY);

      g.minutes += dt * 2;
      if (g.minutes >= 1440) {
        g.minutes -= 1440;
        g.day += 1;
      }

      g.stats = {
        ...g.stats,
        hunger: clamp(g.stats.hunger - dt * 0.6, 0, 100),
        energy: clamp(g.stats.energy - dt * 0.4, 0, 100),
        fun: clamp(g.stats.fun - dt * 0.3, 0, 100),
      };

      stepNpcs(g.npcs, dt);
      g.currentLocation = getLocationAtBuilding(g.pos);
    }

    const now = performance.now();
    if (now - lastSync.current > 120) {
      lastSync.current = now;
      setView({ ...g });
    }
  }, []);

  useEffect(() => {
    rt.current.busy = dialogue !== null || showTransport;
  }, [dialogue, showTransport]);

  useEffect(() => {
    const data = loadGame();
    if (!data) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const g = rt.current;
      g.playerName = data.playerName;
      g.look = isCharacterLook(data.look) ? data.look : { ...DEFAULT_LOOK };
      g.pos = data.pos;
      g.minutes = data.minutes;
      g.day = data.day;
      g.stats = data.stats;
      g.currentLocation = getLocationAtBuilding(g.pos);
      g.log = ["Jogo carregado. Bem-vindo de volta!", ...data.log].slice(0, 6);
      sync();
      setStarted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sync]);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      const g = rt.current;
      saveGame({
        version: 1,
        playerName: g.playerName,
        look: g.look,
        pos: g.pos,
        minutes: g.minutes,
        day: g.day,
        stats: g.stats,
        log: g.log,
      });
    }, 8000);
    return () => window.clearInterval(id);
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (MOVE_KEYS.includes(k)) e.preventDefault();
      if (k === "e" && !e.repeat && !rt.current.busy) {
        const near = nearestNpc(rt.current.pos, rt.current.npcs);
        if (near) talk(near.id);
      }
      rt.current.keys.add(k);
    };
    const up = (e: KeyboardEvent) => rt.current.keys.delete(e.key.toLowerCase());
    const clear = () => rt.current.keys.clear();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [started, talk]);

  if (!started) return <StartScreen onStart={handleStart} />;

  const location = view.currentLocation
    ? (LOCATIONS.find((l) => l.id === view.currentLocation) ?? null)
    : null;
  const dialogueNpc = dialogue
    ? NPCS.find((n) => n.id === dialogue.npcId)
    : undefined;

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#1a1410]">
      <Hud
        playerName={view.playerName}
        look={view.look}
        day={view.day}
        minutes={view.minutes}
        stats={view.stats}
        locationName={location?.name ?? null}
        onSave={handleSave}
        onNewGame={handleNewGame}
      />
      <Map3D
        runtime={rt}
        look={view.look}
        onEnter={handleEnter}
        onTalk={talk}
        onFrame={onFrame}
      />
      <ActionPanel
        location={location}
        stats={view.stats}
        log={view.log}
        onAction={handleAction}
        onTransport={() => setShowTransport(true)}
        onSleep={handleSleep}
      />

      {dialogue && dialogueNpc && (
        <Dialogue
          npc={dialogueNpc}
          line={dialogue.line}
          onNext={dialogueNext}
          onClose={() => setDialogue(null)}
        />
      )}

      {showTransport && (
        <TransportPanel
          options={getTransportOptions(view.currentLocation, view.pos)}
          money={view.stats.money}
          onTravel={handleTravel}
          onClose={() => setShowTransport(false)}
        />
      )}
    </div>
  );
}
