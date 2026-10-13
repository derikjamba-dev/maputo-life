"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import { characterModelPath, useModelSize } from "@/lib/three/models";
import type { CharacterLook } from "@/types/game";

const PREVIEW_HEIGHT = 2;

function PreviewMesh({ look }: { look: CharacterLook }) {
  const path = useMemo(() => characterModelPath(look), [look]);
  const gltf = useGLTF(path);
  const box = useModelSize(path);

  const scale = useMemo(() => {
    const sy = box.getSize(new THREE.Vector3()).y || 1;
    return PREVIEW_HEIGHT / sy;
  }, [box]);

  const center = useMemo(() => {
    const c = box.getCenter(new THREE.Vector3());
    return [-c.x, -box.min.y, -c.z] as const;
  }, [box]);

  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);

  const group = useRef<THREE.Group>(null);
  const phase = useRef(0.6);

  useFrame((_, delta) => {
    phase.current += delta * 0.7;
    if (group.current) group.current.rotation.y = phase.current;
  });

  return (
    <group ref={group} scale={scale}>
      <primitive object={scene} position={center} />
    </group>
  );
}

export default function CharacterPreview({ look }: { look: CharacterLook }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.25, 3.3], fov: 34 }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2.5, 4, 3]} intensity={2} />
      <directionalLight position={[-2, 1.5, -2]} intensity={0.6} />
      <Suspense fallback={null}>
        <PreviewMesh look={look} />
      </Suspense>
    </Canvas>
  );
}
