"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Scene3D from "./Scene3D";
import Model3D from "./Model3D";
import ModelErrorBoundary from "./ModelErrorBoundary";
import { useModels3D } from "@/hooks/useModels3D";

export default function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const { modelUrls, loaded } = useModels3D();

  // Elige un modelo al azar entre los subidos por el administrador (ver
  // Models3DManager). Si todavía no hay ninguno, se queda sin modelPath y
  // se muestra directamente la figura de respaldo (Scene3D).
  useEffect(() => {
    if (!loaded) return;
    const picked = modelUrls.length > 0
      ? modelUrls[Math.floor(Math.random() * modelUrls.length)]
      : null;
    setModelPath(picked);
    setMounted(true);
  }, [loaded, modelUrls]);

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
        
        {/* Figura en movimiento: uno de los modelos .glb subidos por el admin,
            elegido al azar, con Scene3D como respaldo si no hay ninguno
            subido o si el archivo elegido falla al cargar */}
        {modelPath ? (
          <ModelErrorBoundary fallback={<Scene3D />}>
            <Suspense fallback={null}>
              <Model3D path={modelPath} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <Scene3D />
        )}

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
