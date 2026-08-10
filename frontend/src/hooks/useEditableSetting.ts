'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';

export function useEditableSetting<T>(settingsId: string, defaults: T) {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'administrador';
  const [data, setData] = useState<T>(defaults);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<T>(defaults);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', settingsId));
        if (snap.exists()) setData(snap.data() as T);
      } catch { /* usa defaults */ }
    })();
  }, [settingsId]);

  const startEdit = () => { setForm({ ...data }); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    try {
      await setDoc(doc(db!, 'settings', settingsId), form as Record<string, unknown>);
      setData({ ...form });
      setEditing(false);
    } catch { /* error */ }
  };

  return { isAdmin, data, editing, form, setForm, startEdit, cancelEdit, saveEdit };
}
