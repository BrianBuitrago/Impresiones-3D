"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Shuffle, ZoomIn, ZoomOut } from "lucide-react";
import Scene3D from "./Scene3D";
import Model3D from "./Model3D";
import ModelErrorBoundary from "./ModelErrorBoundary";
import { useModels3D } from "@/hooks/useModels3D";

// Elige un modelo al azar entre los subidos, evitando repetir el actual
// cuando hay más de uno disponible.
function pickRandomModel(urls: string[], exclude: string | null): string | null {
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0];
  let candidate: string;
  do {
    candidate = urls[Math.floor(Math.random() * urls.length)];
  } while (candidate === exclude);
  return candidate;
}

export default function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const { modelUrls, loaded } = useModels3D();
  const controlsRef = useRef<any>(null);

  // Acerca/aleja la cámara manteniendo el punto al que mira OrbitControls,
  // y le avisa a los controles que recalculen su estado interno a partir de
  // la nueva posición (si no, en el próximo frame la pisan con la vieja).
  const handleZoom = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const target = controls.target;
    const newPos = camera.position.clone().sub(target).multiplyScalar(factor).add(target);
    const minDist = controls.minDistance ?? 1;
    const maxDist = controls.maxDistance ?? 14;
    const dist = newPos.distanceTo(target);
    if (dist < minDist || dist > maxDist) return;
    camera.position.copy(newPos);
    controls.update();
  };

  // Elige un modelo al azar entre los subidos por el administrador (ver
  // Models3DManager). Si todavía no hay ninguno, se queda sin modelPath y
  // se muestra directamente la figura de respaldo (Scene3D).
  useEffect(() => {
    if (!loaded) return;
    setModelPath(pickRandomModel(modelUrls, null));
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
    <div className="relative w-full h-full">
      {modelUrls.length > 1 && (
        <button
          type="button"
          onClick={() => {
            setModelPath((prev) => pickRandomModel(modelUrls, prev));
            // Vuelve la cámara a la posición inicial para que se note claro
            // que cambió de modelo, en vez de seguir girando desde donde
            // había quedado con el modelo anterior.
            controlsRef.current?.reset();
          }}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-cyan-400 font-medium transition-colors cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Ver otro modelo
        </button>
      )}

      {/* Acercar/alejar el modelo, sin depender del scroll de la rueda del mouse */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleZoom(0.85)}
          aria-label="Acercar modelo"
          title="Acercar"
          className="p-2 bg-slate-950/80 hover:bg-slate-800 rounded-full border border-slate-800 text-cyan-400 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.18)}
          aria-label="Alejar modelo"
          title="Alejar"
          className="p-2 bg-slate-950/80 hover:bg-slate-800 rounded-full border border-slate-800 text-cyan-400 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
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
          ref={controlsRef}
          enableZoom={false} // Evita que el scroll de la página haga zoom en el 3D; el acercar/alejar es manual con los botones
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
          minDistance={1}
          maxDistance={14}
        />
      </Canvas>
    </div>
  );
}
