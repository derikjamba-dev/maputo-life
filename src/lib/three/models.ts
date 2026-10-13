import { useGLTF } from "@react-three/drei";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three";

import type { Building, Prop, PropKind } from "@/types/world";
import type { CharacterLook } from "@/types/game";

const SUBURBAN_BUILDINGS = Array.from({ length: 20 }, (_, i) =>
  `building-type-${String.fromCharCode(97 + i)}`,
);
const COMMERCIAL_BUILDINGS = Array.from({ length: 14 }, (_, i) =>
  `building-${String.fromCharCode(97 + i)}`,
);
const SKYSCRAPERS = ["a", "b", "c", "d", "e"];

const suburb = (n: string) => `/models/world/suburban/${n}.glb`;
const comm = (n: string) => `/models/world/commercial/${n}.glb`;
const nat = (n: string) => `/models/world/nature/${n}.glb`;
const pir = (n: string) => `/models/world/pirate/${n}.glb`;
const car = (n: string) => `/models/world/car/${n}.glb`;

export function hashIndex(id: string, n: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

export function buildingModelPath(b: Building): string {
  const i = hashIndex(b.id, 40);
  if (b.type === "home") return suburb(SUBURBAN_BUILDINGS[i % SUBURBAN_BUILDINGS.length]);
  if (b.type === "club") return comm(`building-skyscraper-${SKYSCRAPERS[i % SKYSCRAPERS.length]}`);
  if (b.type === "transport") return pir("structure-roof");
  return comm(COMMERCIAL_BUILDINGS[i % COMMERCIAL_BUILDINGS.length]);
}

export function characterModelPath(look: CharacterLook): string {
  return `/models/chars/character_${look.gender}_${look.variant}.glb`;
}

export function propModelPath(p: Prop): string | null {
  if (p.kind === "palm") return p.x >= 1820 ? pir("palm-straight") : nat("tree_palmTall");
  if (p.kind === "tree") return nat("tree_default");
  if (p.kind === "kiosk") return comm("detail-awning-wide");
  if (p.kind === "chapa") return car("van");
  if (p.kind === "boat")
    return hashIndex(`${p.x.toFixed(0)}:${p.y.toFixed(0)}`, 2)
      ? pir("boat-row-large")
      : pir("boat-row-small");
  return null;
}

export const PROP_TRAFFIC: PropKind[] = ["traffic"];

export interface ModelPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export interface ModelData {
  box: THREE.Box3;
  parts: ModelPart[];
}

const partsCache = new Map<string, ModelData>();

export function computeBox(scene: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const g = mesh.geometry as THREE.BufferGeometry;
    g.computeBoundingBox();
    const bb = g.boundingBox;
    if (bb) box.union(bb.clone().applyMatrix4(mesh.matrixWorld));
  });
  return box;
}

export function getModelData(path: string, scene: THREE.Group): ModelData {
  const cached = partsCache.get(path);
  if (cached) return cached;

  scene.updateMatrixWorld(true);
  const box = computeBox(scene);
  const byMat = new Map<string, { material: THREE.Material; geoms: THREE.BufferGeometry[] }>();

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      let rec = byMat.get(m.uuid);
      if (!rec) {
        rec = { material: m, geoms: [] };
        byMat.set(m.uuid, rec);
      }
      rec.geoms.push((mesh.geometry as THREE.BufferGeometry).clone().applyMatrix4(mesh.matrixWorld));
    }
  });

  const parts: ModelPart[] = [];
  for (const rec of byMat.values()) {
    const geometry =
      rec.geoms.length === 1 ? rec.geoms[0] : mergeGeometries(rec.geoms, false) ?? rec.geoms[0];
    parts.push({ geometry, material: rec.material });
  }

  const data: ModelData = { box, parts };
  partsCache.set(path, data);
  return data;
}

const sizeCache = new Map<string, THREE.Box3>();

export function useModelSize(path: string): THREE.Box3 {
  const gltf = useGLTF(path);
  let box = sizeCache.get(path);
  if (!box) {
    box = computeBox(gltf.scene);
    sizeCache.set(path, box);
  }
  return box;
}