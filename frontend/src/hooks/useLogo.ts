'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_LOGO = '/logo.png';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dobul5gbb';
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'impresiones3d_unsigned';

// Logo del sitio (navbar + footer): se guarda en settings/logo para que el
// administrador lo pueda cambiar sin tocar código. Si no hay uno subido todavía,
// se usa el archivo estático /logo.png como respaldo.
export function useLogo() {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'administrador';
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', 'logo'));
        if (snap.exists() && snap.data().url) setLogoUrl(snap.data().url as string);
      } catch {
        // usa el logo por defecto
      }
    })();
  }, []);

  const uploadNewLogo = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      formData.append('folder', 'branding');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir el logo.');
      const data = await res.json();
      const url = data.secure_url as string;
      await setDoc(doc(db!, 'settings', 'logo'), { url });
      setLogoUrl(url);
    } catch (err: any) {
      setError(err.message || 'Error al subir el logo.');
    } finally {
      setUploading(false);
    }
  };

  return { logoUrl, isAdmin, uploading, error, uploadNewLogo };
}
