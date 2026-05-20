"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function Scene3D() {
  const meshRef = useRef<Mesh>(null);

  // Hace que la figura rote en cada fotograma
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group>
      {/* Figura 3D: Un Torus Knot (nudo de dona) que parece una pieza compleja impresa en 3D */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <torusKnotGeometry args={[1, 0.35, 120, 16]} />
        <meshPhysicalMaterial
          color="#06b6d4" // Cian brillante
          roughness={0.1}
          metalness={0.8}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          wireframe={true} // Estructura metálica futurista
        />
      </mesh>

      {/* Una segunda figura interna sólida para dar efecto de profundidad */}
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.35, 120, 16]} />
        <meshPhysicalMaterial
          color="#3b82f6" // Azul brillante
          roughness={0.5}
          metalness={0.2}
          transmission={0.6} // Semi-translúcido
          thickness={1.2}
        />
      </mesh>
    </group>
  );
}
