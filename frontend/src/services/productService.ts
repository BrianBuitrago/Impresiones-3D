import { db } from './firebase';
import {
  collection, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import type { Product, ProductFormData } from '@/types/productos';

const COLLECTION = 'products';

export async function fetchProductos(): Promise<Product[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Product))
    .filter(p => p.activo)
    .sort((a, b) => (a.orden || 99) - (b.orden || 99));
}

export async function fetchAllProductos(): Promise<Product[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Product))
    .sort((a, b) => (a.orden || 99) - (b.orden || 99));
}

export async function fetchProducto(id: string): Promise<Product | null> {
  const d = await getDoc(doc(db, COLLECTION, id));
  return d.exists() ? { id: d.id, ...d.data() } as Product : null;
}

function cleanData(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

export async function crearProducto(data: ProductFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...cleanData(data as unknown as Record<string, unknown>),
    creadoEn: Timestamp.now(),
  });
  return ref.id;
}

export async function actualizarProducto(id: string, data: Partial<ProductFormData>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...cleanData(data as unknown as Record<string, unknown>),
    actualizadoEn: Timestamp.now(),
  });
}

export async function eliminarProducto(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
