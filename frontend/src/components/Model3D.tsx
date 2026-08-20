"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";

interface Model3DProps {
  path: string;
}

// Carga un modelo .glb cualquiera y lo normaliza: lo centra en el origen y lo
// escala para que siempre ocupe el mismo tamaño visual, sin importar en qué
// unidades ni con qué origen se haya exportado el archivo original.
export default function Model3D({ path }: Model3DProps) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<Group>(null);

  // Clona la escena para no mutar el resultado que useGLTF cachea internamente
  // (por si el mismo archivo se vuelve a usar en otra parte de la app).
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / maxDim;
    cloned.scale.setScalar(scale);
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [cloned]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}
