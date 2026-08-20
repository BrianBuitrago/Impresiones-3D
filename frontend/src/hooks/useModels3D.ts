'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dobul5gbb';
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'impresiones3d_unsigned';
const MODELS_SETTINGS_ID = 'models3d';

// Modelos 3D del hero de inicio: el administrador los sube desde la propia
// página (sin tocar código ni redeploy). Se guardan en Cloudinary (resource_type
// raw, ya que un .glb no es una imagen) y sus URLs en settings/models3d.
// Hero3D elige uno al azar entre los subidos en cada carga de página; si no
// hay ninguno, se usa la figura de respaldo (Scene3D).
export function useModels3D() {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'administrador';
  const [modelUrls, setModelUrls] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', MODELS_SETTINGS_ID));
        if (snap.exists() && Array.isArray(snap.data().urls)) {
          setModelUrls(snap.data().urls as string[]);
        }
      } catch {
        // se queda sin modelos, Hero3D usa la figura de respaldo
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const uploadModel = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError('Selecciona un archivo .glb válido.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      formData.append('folder', 'models3d');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/raw/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir el modelo 3D.');
      const data = await res.json();
      const url = data.secure_url as string;
      // arrayUnion es atómico en el servidor: si dos subidas se solapan, ninguna
      // pisa a la otra (a diferencia de leer+escribir el array completo desde acá).
      await setDoc(doc(db!, 'settings', MODELS_SETTINGS_ID), { urls: arrayUnion(url) }, { merge: true });
      setModelUrls((prev) => [...prev, url]);
    } catch (err: any) {
      setError(err.message || 'Error al subir el modelo 3D.');
    } finally {
      setUploading(false);
    }
  };

  const deleteModel = async (url: string) => {
    setError(null);
    try {
      await setDoc(doc(db!, 'settings', MODELS_SETTINGS_ID), { urls: arrayRemove(url) }, { merge: true });
      setModelUrls((prev) => prev.filter((u) => u !== url));
    } catch {
      setError('Error al eliminar el modelo 3D.');
    }
  };

  return { modelUrls, loaded, isAdmin, uploading, error, uploadModel, deleteModel };
}
