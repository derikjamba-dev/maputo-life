"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getModelData } from "@/lib/three/models";

export function Variant({ path, matrices }: { path: string; matrices: THREE.Matrix4[] }) {
  const gltf = useGLTF(path);
  const data = useMemo(() => getModelData(path, gltf.scene), [path, gltf]);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    for (let i = 0; i < refs.current.length; i++) {
      const im = refs.current[i];
      if (!im) continue;
      for (let j = 0; j < matrices.length; j++) {
        im.setMatrixAt(j, matrices[j]);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }, [data, matrices]);

  return (
    <>
      {data.parts.map((part, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          args={[part.geometry, part.material, matrices.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}