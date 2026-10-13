"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, useGLTF } from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import * as THREE from "three";

import {
  WORLD_CENTER_X,
  WORLD_CENTER_Z,
  WORLD_D,
  WORLD_W,
  toX,
  toZ,
} from "@/lib/three/coords";
import {
  CENTER_LINE_WIDTH,
  buildingMatrix,
  buildingTopY,
  groupBuildings,
  groupProps,
  propMatrix,
  roadStrips,
} from "@/lib/three/layout";
import { characterModelPath, hashIndex, useModelSize } from "@/lib/three/models";
import { PALETTE, SKY } from "@/lib/three/palette";
import { Variant } from "@/components/game/ModelVariant";
import { nearestNpc, TALK_RADIUS } from "@/lib/npcs";
import { setMoveTarget } from "@/lib/player";
import { buildingAt, CITY } from "@/lib/world";
import type { CharacterLook, GameRuntime } from "@/types/game";
import type { Building, Prop } from "@/types/world";

const TARGET_MARGIN = 240;

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const DAY_SKY = new THREE.Color(SKY.day);
const NIGHT_SKY = new THREE.Color(SKY.night);
const DAY_FOG = new THREE.Color(SKY.fog);
const NIGHT_FOG = new THREE.Color("#101a34");
const SUN_NOON = new THREE.Color("#fff3dc");
const SUN_NIGHT = new THREE.Color("#93a6d8");

function daylight(minutes: number): number {
  const h = (((minutes % 1440) + 1440) % 1440) / 60;
  const up = smooth01((h - 5.5) / 2.2);
  const down = smooth01((18.5 - h) / 2.2);
  return up * down;
}

function smooth01(t: number): number {
  const x = clampNum(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function polygonShape(points: { x: number; y: number }[]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach((p, i) => {
    const x = toX(p.x);
    const z = toZ(p.y);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

function Ground() {
  return (
    <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[WORLD_W, WORLD_D]} />
      <meshStandardMaterial color={PALETTE.ground} roughness={1} metalness={0} />
    </mesh>
  );
}

function Districts() {
  const shapes = useMemo(
    () => CITY.districts.map((d) => ({ id: d.id, color: d.color, shape: polygonShape(d.polygon) })),
    [],
  );
  return (
    <>
      {shapes.map((d) => (
        <mesh key={d.id} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
          <shapeGeometry args={[d.shape]} />
          <meshStandardMaterial color={d.color} roughness={1} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function Water() {
  const shape = useMemo(() => polygonShape(CITY.water.points), []);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color={PALETTE.water}
        roughness={0.25}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Roads() {
  const strips = useMemo(() => roadStrips(), []);
  return (
    <>
      {strips.map((r) => {
        const acc: [number, number] = r.horizontal ? [r.len, r.half * 2] : [r.half * 2, r.len];
        const line: [number, number] | null = r.lanes >= 4 ? (r.horizontal ? [r.len, CENTER_LINE_WIDTH] : [CENTER_LINE_WIDTH, r.len]) : null;
        return (
          <group key={`${r.x.toFixed(1)}:${r.z.toFixed(1)}:${r.horizontal}`}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[r.x, 0.14, r.z]} receiveShadow>
              <planeGeometry args={acc} />
              <meshStandardMaterial color={PALETTE.road} roughness={0.95} metalness={0} />
            </mesh>
            {line && (
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[r.x, 0.22, r.z]}>
                <planeGeometry args={line} />
                <meshStandardMaterial color={PALETTE.roadLine} roughness={0.9} metalness={0} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

function BuildingVariant({ path, buildings }: { path: string; buildings: Building[] }) {
  const box = useModelSize(path);
  const matrices = useMemo(
    () =>
      buildings.map((b) =>
        buildingMatrix(b, box, (hashIndex(b.id, 4) * Math.PI) / 2),
      ),
    [buildings, box],
  );
  return (
    <Suspense fallback={null}>
      <Variant path={path} matrices={matrices} />
    </Suspense>
  );
}

function Buildings() {
  const groups = useMemo(() => groupBuildings(), []);
  return (
    <Suspense fallback={null}>
      {Array.from(groups.entries()).map(([path, list]) => (
        <BuildingVariant key={path} path={path} buildings={list} />
      ))}
    </Suspense>
  );
}

function PropVariant({ path, props }: { path: string; props: Prop[] }) {
  const box = useModelSize(path);
  const matrices = useMemo(
    () =>
      props.map((p) =>
        propMatrix(p, box, (hashIndex(`${p.x.toFixed(0)}:${p.y.toFixed(0)}`, 8) * Math.PI) / 4),
      ),
    [props, box],
  );
  return (
    <Suspense fallback={null}>
      <Variant path={path} matrices={matrices} />
    </Suspense>
  );
}

const LIGHT_COLORS = ["#e5484d", "#f0b429", "#46a758"] as const;

function TrafficLight({ p }: { p: Prop }) {
  return (
    <group position={[toX(p.x), 0, toZ(p.y)]}>
      <mesh position={[0, 34, 0]}>
        <cylinderGeometry args={[2.6, 3.2, 68, 8]} />
        <meshStandardMaterial color="#39404f" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 74, 0]} castShadow>
        <boxGeometry args={[13, 36, 9]} />
        <meshStandardMaterial color="#2b3140" roughness={0.6} metalness={0.2} />
      </mesh>
      {LIGHT_COLORS.map((c, i) => (
        <mesh key={c} position={[0, 60 + i * 12, 0]}>
          <sphereGeometry args={[2.9, 12, 12]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={0.85}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function Props() {
  const { paths, traffic } = useMemo(() => groupProps(), []);
  return (
    <>
      <Suspense fallback={null}>
        {Array.from(paths.entries()).map(([path, list]) => (
          <PropVariant key={path} path={path} props={list} />
        ))}
      </Suspense>
      {traffic.map((p) => (
        <TrafficLight key={`${p.x.toFixed(0)}:${p.y.toFixed(0)}`} p={p} />
      ))}
    </>
  );
}

const labelCache = new Map<string, THREE.CanvasTexture>();

function labelTexture(text: string): THREE.CanvasTexture {
  const hit = labelCache.get(text);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 96;
  const ctx = cv.getContext("2d");
  if (ctx) {
    ctx.font = "600 44px 'Trebuchet MS', system-ui, sans-serif";
    const tw = Math.min(ctx.measureText(text).width + 48, 512);
    ctx.fillStyle = "rgba(14, 26, 20, 0.72)";
    ctx.beginPath();
    ctx.roundRect((512 - tw) / 2, 10, tw, 76, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 52);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  labelCache.set(text, tex);
  return tex;
}

function BuildingLabels({ path, buildings }: { path: string; buildings: Building[] }) {
  const box = useModelSize(path);
  return (
    <>
      {buildings.map((b) => {
        const { topY } = buildingTopY(b, box);
        return (
          <sprite
            key={b.id}
            position={[toX(b.x + b.w / 2), topY + 30, toZ(b.y + b.h / 2)]}
            scale={[300, 56, 1]}
          >
            <spriteMaterial map={labelTexture(b.name)} transparent depthWrite={false} />
          </sprite>
        );
      })}
    </>
  );
}

function Labels() {
  const groups = useMemo(() => groupBuildings(), []);
  const labeled = useMemo(() => {
    const map = new Map<string, Building[]>();
    for (const [path, list] of groups) {
      const landmarks = list.filter((b) => b.locationId);
      if (landmarks.length) map.set(path, landmarks);
    }
    return map;
  }, [groups]);
  return (
    <Suspense fallback={null}>
      {Array.from(labeled.entries()).map(([path, list]) => (
        <BuildingLabels key={path} path={path} buildings={list} />
      ))}
    </Suspense>
  );
}

interface ControlsLike {
  target: THREE.Vector3;
  object: THREE.Camera;
}

type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

function Controls() {
  const ref = useRef<OrbitControlsRef>(null);
  useFrame(() => {
    const controls = ref.current as unknown as ControlsLike | null;
    if (!controls) return;
    const t = controls.target;
    const x = clampNum(t.x, -WORLD_CENTER_X + TARGET_MARGIN, WORLD_CENTER_X - TARGET_MARGIN);
    const z = clampNum(t.z, -WORLD_CENTER_Z + TARGET_MARGIN, WORLD_CENTER_Z - TARGET_MARGIN);
    const dx = x - t.x;
    const dz = z - t.z;
    if (dx || dz) {
      t.x += dx;
      t.z += dz;
      controls.object.position.x += dx;
      controls.object.position.z += dz;
    }
  });
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.6}
      zoomSpeed={0.9}
      panSpeed={0.9}
      zoomToCursor
      minPolarAngle={0.5}
      maxPolarAngle={1.2}
      minZoom={0.18}
      maxZoom={2.6}
    />
  );
}

function GameLoop({ onFrame }: { onFrame: (dt: number) => void }) {
  const cb = useRef(onFrame);
  useEffect(() => {
    cb.current = onFrame;
  }, [onFrame]);
  useFrame((_, delta) => cb.current(Math.min(delta, 0.05)));
  return null;
}

export interface Map3DProps {
  runtime: RefObject<GameRuntime>;
  look: CharacterLook;
  onEnter: (building: Building) => void;
  onTalk: (npcId: string) => void;
  onFrame: (dt: number) => void;
}

interface PointerState {
  ndcX: number;
  ndcY: number;
}

function ClickRouter({
  pointerRef,
  runtime,
  onEnter,
  onTalk,
}: {
  pointerRef: RefObject<PointerState | null>;
  runtime: RefObject<GameRuntime>;
  onEnter: (b: Building) => void;
  onTalk: (npcId: string) => void;
}) {
  const raycaster = useThree((s) => s.raycaster);
  const camera = useThree((s) => s.camera);
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useFrame(() => {
    const p = pointerRef.current;
    if (!p) return;
    pointerRef.current = null;
    const g = runtime.current;
    if (!g || g.busy) return;
    raycaster.setFromCamera(new THREE.Vector2(p.ndcX, p.ndcY), camera);
    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane.current, hit)) return;
    const wx = hit.x + WORLD_CENTER_X;
    const wy = hit.z + WORLD_CENTER_Z;
    const npc = nearestNpc({ x: wx, y: wy }, g.npcs, 60);
    if (npc) {
      const d = Math.hypot(npc.pos.x - g.pos.x, npc.pos.y - g.pos.y);
      if (d <= TALK_RADIUS * 1.6) {
        onTalk(npc.id);
      } else {
        setMoveTarget(g, { x: npc.pos.x, y: npc.pos.y }, CITY);
      }
      return;
    }
    const b = buildingAt(wx, wy);
    if (b) {
      onEnter(b);
      return;
    }
    setMoveTarget(g, { x: wx, y: wy }, CITY);
  });

  return null;
}

const PLAYER_HEIGHT = 46;

function Player({
  runtime,
  look,
}: {
  runtime: RefObject<GameRuntime>;
  look: CharacterLook;
}) {
  const path = useMemo(() => characterModelPath(look), [look]);
  const gltf = useGLTF(path);
  const box = useModelSize(path);
  const scale = useMemo(() => {
    const sy = box.getSize(new THREE.Vector3()).y || 1;
    return PLAYER_HEIGHT / sy;
  }, [box]);

  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return s;
  }, [gltf]);

  const group = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);
  const yaw = useRef(0);
  const phase = useRef(0);
  const last = useRef<{ x: number; z: number } | null>(null);

  useFrame((_, delta) => {
    const g = runtime.current;
    if (!g) return;
    const px = toX(g.pos.x);
    const pz = toZ(g.pos.y);
    let moved = 0;
    const lp = last.current;
    if (lp) {
      moved = Math.hypot(px - lp.x, pz - lp.z);
      if (moved > 1e-4) {
        yaw.current = Math.atan2(px - lp.x, pz - lp.z);
        phase.current += delta * 9;
      }
    }
    last.current = { x: px, z: pz };
    const bob = moved > 1e-4 ? Math.abs(Math.sin(phase.current * 2)) * 1.1 : 0;
    if (group.current) {
      group.current.rotation.y = yaw.current;
      group.current.position.set(px, -box.min.y * scale + bob, pz);
    }
    if (disc.current) disc.current.position.set(px, 0.05, pz);
  });

  return (
    <>
      <group ref={group} scale={scale}>
        <primitive object={scene} />
      </group>
      <mesh ref={disc} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[20, 24]} />
        <meshBasicMaterial color="#0d1a14" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </>
  );
}

function MoveMarker({ runtime }: { runtime: RefObject<GameRuntime> }) {
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const el = ring.current;
    if (!el) return;
    const mt = runtime.current?.moveTarget;
    if (!mt) {
      el.visible = false;
      return;
    }
    el.visible = true;
    el.position.set(toX(mt.x), 0.6, toZ(mt.y));
    const pulse = 1 + (Math.sin(t.current * 5) * 0.5 + 0.5) * 0.4;
    el.scale.set(pulse, pulse, 1);
  });

  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[17, 21, 40]} />
      <meshBasicMaterial color="#ffd75e" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

function characterForNpc(index: number): string {
  const gender = index % 2 === 0 ? "male" : "female";
  const letter = String.fromCharCode(97 + (index % 6));
  return `/models/chars/character_${gender}_${letter}.glb`;
}

function Npc({ runtime, index }: { runtime: RefObject<GameRuntime>; index: number }) {
  const path = useMemo(() => characterForNpc(index), [index]);
  const gltf = useGLTF(path);
  const box = useModelSize(path);
  const scale = useMemo(() => {
    const sy = box.getSize(new THREE.Vector3()).y || 1;
    return PLAYER_HEIGHT / sy;
  }, [box]);

  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return s;
  }, [gltf]);

  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const yaw = useRef(0);
  const phase = useRef(0);
  const last = useRef<{ x: number; z: number } | null>(null);

  useFrame((_, delta) => {
    const g = runtime.current;
    if (!g) return;
    const st = g.npcs[index];
    if (!st) return;
    const px = toX(st.pos.x);
    const pz = toZ(st.pos.y);
    let moved = 0;
    const lp = last.current;
    if (lp) {
      moved = Math.hypot(px - lp.x, pz - lp.z);
      if (moved > 1e-4) {
        yaw.current = Math.atan2(px - lp.x, pz - lp.z);
        phase.current += delta * 9;
      }
    }
    last.current = { x: px, z: pz };
    const bob = moved > 1e-4 ? Math.abs(Math.sin(phase.current * 2)) * 1.1 : 0;
    if (group.current) {
      group.current.position.set(px, -box.min.y * scale + bob, pz);
      group.current.rotation.y = yaw.current;
    }
    if (ring.current) {
      const d = Math.hypot(st.pos.x - g.pos.x, st.pos.y - g.pos.y);
      ring.current.visible = d < TALK_RADIUS * 1.4;
    }
  });

  return (
    <group>
      <group ref={group} scale={scale}>
        <primitive object={scene} />
      </group>
      <mesh
        ref={ring}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
        visible={false}
      >
        <ringGeometry args={[15, 19, 36]} />
        <meshBasicMaterial color="#a7f3a2" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Npcs({ runtime }: { runtime: RefObject<GameRuntime> }) {
  const count = useMemo(() => runtime.current?.npcs.length ?? 0, [runtime]);
  return (
    <Suspense fallback={null}>
      {Array.from({ length: count }, (_, i) => (
        <Npc key={i} runtime={runtime} index={i} />
      ))}
    </Suspense>
  );
}

function DayCycle({ runtime }: { runtime: RefObject<GameRuntime> }) {
  const bgRef = useRef<THREE.Color>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const tmpA = useRef(new THREE.Color());
  const tmpB = useRef(new THREE.Color());

  useFrame(() => {
    const g = runtime.current;
    if (!g) return;
    const b = daylight(g.minutes);
    const a = tmpA.current;
    const c = tmpB.current;
    a.lerpColors(NIGHT_SKY, DAY_SKY, b);
    bgRef.current?.copy(a);
    c.lerpColors(NIGHT_FOG, DAY_FOG, b);
    if (fogRef.current) fogRef.current.color.copy(c);
    a.lerpColors(SUN_NIGHT, SUN_NOON, b);
    if (sunRef.current) {
      sunRef.current.color.copy(a);
      sunRef.current.intensity = 0.2 + 0.95 * b;
    }
    if (ambRef.current) ambRef.current.intensity = 0.3 + 0.6 * b;
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={[SKY.day]} />
      <fog ref={fogRef} attach="fog" args={[SKY.fog, 1100, 5200]} />
      <ambientLight ref={ambRef} intensity={0.9} />
      <directionalLight
        ref={sunRef}
        position={[60, 90, 40]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-1600}
        shadow-camera-right={1600}
        shadow-camera-top={1600}
        shadow-camera-bottom={-1600}
        shadow-camera-near={1}
        shadow-camera-far={6000}
      />
    </>
  );
}

export default function Map3D({ runtime, look, onFrame, onEnter, onTalk }: Map3DProps) {
  const pointer = useRef<PointerState | null>(null);
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      ndcX: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      ndcY: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  };

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ background: SKY.day }}
      onPointerDown={handlePointerDown}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        className="absolute inset-0 block h-full w-full touch-none select-none"
      >
        <OrthographicCamera
          makeDefault
          position={[640, 720, 640]}
          zoom={0.42}
          near={-2000}
          far={6000}
        />
        <Controls />
        <GameLoop onFrame={onFrame} />

        <DayCycle runtime={runtime} />

        <Ground />
        <Districts />
        <Water />
        <Roads />
        <Buildings />
        <Props />
        <Labels />
        <ClickRouter pointerRef={pointer} runtime={runtime} onEnter={onEnter} onTalk={onTalk} />
        <Suspense fallback={null}>
          <Player runtime={runtime} look={look} />
        </Suspense>
        <MoveMarker runtime={runtime} />
        <Npcs runtime={runtime} />
      </Canvas>

      <div className="pointer-events-none absolute left-3 top-3 z-20 hidden items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-white/85 backdrop-blur sm:inline-flex">
        rodar · arrastar · clicar p/ andar · E p/ falar
      </div>
    </div>
  );
}
