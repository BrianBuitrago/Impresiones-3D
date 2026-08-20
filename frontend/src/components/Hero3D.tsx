"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Scene3D from "./Scene3D";
import Model3D from "./Model3D";
import ModelErrorBoundary from "./ModelErrorBoundary";

// Modelos 3D disponibles para el hero (archivos .glb en frontend/public/models/,
// ver el README ahí). En cada carga de página se elige uno al azar; si el
// archivo elegido no existe o falla al cargar, se usa Scene3D como respaldo.
const AVAILABLE_MODELS = [
  "/models/model-1.glb",
  "/models/model-2.glb",
  "/models/model-3.glb",
  "/models/model-4.glb",
  "/models/model-5.glb",
];

export default function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const picked = AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];
    setModelPath(picked);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center text-cyan-500/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Iniciando Entorno 3D...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
        {/* Luces avanzadas para resaltar el material metálico */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.8} />
        <pointLight position={[0, -5, 0]} intensity={0.5} color="#06b6d4" />
        
        {/* Figura en movimiento: uno de los modelos .glb elegido al azar, con
            Scene3D como respaldo si no existe o falla al cargar */}
        <ModelErrorBoundary fallback={<Scene3D />}>
          <Suspense fallback={null}>
            {modelPath && <Model3D path={modelPath} />}
          </Suspense>
        </ModelErrorBoundary>

        {/* Controles para que el usuario pueda jugar con la figura */}
        <OrbitControls 
          enableZoom={false} // Evita que el scroll de la página haga zoom en el 3D
          autoRotate 
          autoRotateSpeed={0.5} 
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
