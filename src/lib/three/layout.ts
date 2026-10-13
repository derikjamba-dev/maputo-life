import * as THREE from "three";

import { CITY } from "@/lib/world";
import type { Building, Prop, PropKind } from "@/types/world";
import { toX, toZ } from "@/lib/three/coords";
import { buildingModelPath, propModelPath } from "@/lib/three/models";

export const LANE_PITCH = 48;
export const CENTER_LINE_WIDTH = 7;

export interface RoadStrip {
  x: number;
  z: number;
  len: number;
  half: number;
  horizontal: boolean;
  lanes: number;
}

export function roadStrips(): RoadStrip[] {
  const out: RoadStrip[] = [];
  for (const r of CITY.roads) {
    const pts = r.points;
    if (pts.length < 2) continue;
    const half = (r.lanes * LANE_PITCH) / 2;
    const vertical = pts[0].x === pts[pts.length - 1].x;
    if (vertical) {
      const ys = pts.map((p) => p.y);
      const y0 = Math.min(...ys);
      const y1 = Math.max(...ys);
      out.push({
        x: toX(pts[0].x),
        z: toZ((y0 + y1) / 2),
        len: y1 - y0,
        half,
        horizontal: false,
        lanes: r.lanes,
      });
    } else {
      const xs = pts.map((p) => p.x);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      out.push({
        x: toX((x0 + x1) / 2),
        z: toZ(pts[0].y),
        len: x1 - x0,
        half,
        horizontal: true,
        lanes: r.lanes,
      });
    }
  }
  return out;
}

export function groupBuildings(): Map<string, Building[]> {
  const map = new Map<string, Building[]>();
  for (const b of CITY.buildings) {
    // Landmarks with authored massings are rendered by CustomBuildings instead.
    if (b.massing && b.massing.length) continue;
    const path = buildingModelPath(b);
    let list = map.get(path);
    if (!list) {
      list = [];
      map.set(path, list);
    }
    list.push(b);
  }
  return map;
}

export function groupProps(): { paths: Map<string, Prop[]>; traffic: Prop[] } {
  const paths = new Map<string, Prop[]>();
  const traffic: Prop[] = [];
  for (const p of CITY.props) {
    const path = propModelPath(p);
    if (!path) {
      if (p.kind === "traffic") traffic.push(p);
      continue;
    }
    let list = paths.get(path);
    if (!list) {
      list = [];
      paths.set(path, list);
    }
    list.push(p);
  }
  return { paths, traffic };
}

export function buildingScale(b: Building, box: THREE.Box3): number {
  const size = box.getSize(new THREE.Vector3());
  const sx = size.x || 1;
  const sz = size.z || 1;
  const sy = size.y || 1;
  let s = Math.min(b.w / sx, b.h / sz);
  const maxH = b.type === "club" ? 560 : b.type === "work" ? 380 : 300;
  if (sy * s > maxH) s = maxH / sy;
  return s;
}

export function buildingTopY(b: Building, box: THREE.Box3): { baseY: number; topY: number } {
  const s = buildingScale(b, box);
  const size = box.getSize(new THREE.Vector3());
  const baseY = -box.min.y * s;
  return { baseY, topY: baseY + size.y * s };
}

export function buildingMatrix(
  b: Building,
  box: THREE.Box3,
  yaw: number,
  room = 0.2,
): THREE.Matrix4 {
  const s = buildingScale(b, box);
  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
  matrix.compose(
    new THREE.Vector3(toX(b.x + b.w / 2), -box.min.y * s + room, toZ(b.y + b.h / 2)),
    q,
    new THREE.Vector3(s, s, s),
  );
  return matrix;
}

const PROP_HEIGHTS: Record<PropKind, number> = {
  palm: 220,
  tree: 150,
  kiosk: 60,
  chapa: 90,
  boat: 100,
  traffic: 70,
};

export function propScale(p: Prop, box: THREE.Box3): number {
  const target =
    p.kind === "palm" ? (p.x >= 1820 ? 170 : 230) : PROP_HEIGHTS[p.kind] ?? 100;
  const size = box.getSize(new THREE.Vector3());
  return target / (size.y || 1);
}

export function propMatrix(p: Prop, box: THREE.Box3, yaw: number): THREE.Matrix4 {
  const s = propScale(p, box);
  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
  const sink = p.kind === "boat" ? -8 : 0;
  matrix.compose(
    new THREE.Vector3(toX(p.x), -box.min.y * s + sink, toZ(p.y)),
    q,
    new THREE.Vector3(s, s, s),
  );
  return matrix;
}