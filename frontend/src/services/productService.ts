import { db } from './firebase';
import {
  collection, query, where, orderBy, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import type { Product, ProductFormData } from '@/types/productos';

const COLLECTION = 'products';

export async function fetchProductos(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    where('activo', '==', true),
    orderBy('orden', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function fetchAllProductos(): Promise<Product[]> {
  const q = query(collection(db, COLLECTION), orderBy('orden', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function fetchProducto(id: string): Promise<Product | null> {
  const d = await getDoc(doc(db, COLLECTION, id));
  return d.exists() ? { id: d.id, ...d.data() } as Product : null;
}

export async function crearProducto(data: ProductFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    creadoEn: Timestamp.now(),
  });
  return ref.id;
}

export async function actualizarProducto(id: string, data: Partial<ProductFormData>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    actualizadoEn: Timestamp.now(),
  });
}

export async function eliminarProducto(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function seedProductos(): Promise<void> {
  const { SEED_PRODUCTS } = await import('@/types/productos');
  const existing = await getDocs(query(collection(db, COLLECTION), where('activo', '==', true)));
  if (existing.size > 0) return;
  for (const p of SEED_PRODUCTS) {
    await crearProducto(p);
  }
}
