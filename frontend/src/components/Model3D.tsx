"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import { Box3, Group, Vector3 } from "three";

interface Model3DProps {
  path: string;
}

function GLTFModel({ path }: Model3DProps) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<Group>(null);

  // Clona la escena para no mutar el resultado que useGLTF cachea internamente
  // (por si el mismo archivo se vuelve a usar en otra parte de la app).
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Centra en el origen y escala a un tamaño visual fijo, sin importar en qué
  // unidades ni con qué origen se haya exportado el archivo original.
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

function STLModel({ path }: Model3DProps) {
  // Un .stl solo trae geometría (sin colores ni materiales), así que se
  // renderiza con un material metálico genérico.
  const geometry = useLoader(STLLoader, path);
  const groupRef = useRef<Group>(null);

  const normalized = useMemo(() => {
    const geo = geometry.clone();
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / maxDim;
    geo.translate(-center.x, -center.y, -center.z);
    geo.scale(scale, scale, scale);
    return geo;
  }, [geometry]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={normalized}>
        <meshStandardMaterial color="#9ca3af" metalness={0.25} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Carga un modelo (.glb o .stl) y lo normaliza para que siempre ocupe el
// mismo tamaño visual, sin importar el formato ni cómo se haya exportado.
export default function Model3D({ path }: Model3DProps) {
  const isSTL = path.toLowerCase().split("?")[0].endsWith(".stl");
  return isSTL ? <STLModel path={path} /> : <GLTFModel path={path} />;
}
