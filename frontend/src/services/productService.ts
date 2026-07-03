import { db } from './firebase';
import {
  collection, getDocs, doc, getDoc,
} from 'firebase/firestore';
import type { Product, ProductFormData } from '@/types/productos';

const COLLECTION = 'products';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Error ${res.status}`);
  }
  return res.json();
}

export async function crearProducto(data: ProductFormData, token: string): Promise<string> {
  const result = await apiFetch('/products/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(cleanData(data as unknown as Record<string, unknown>)),
  });
  return result.id;
}

export async function actualizarProducto(id: string, data: Partial<ProductFormData>, token: string): Promise<void> {
  await apiFetch(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(cleanData(data as unknown as Record<string, unknown>)),
  });
}

export async function eliminarProducto(id: string, token: string): Promise<void> {
  await apiFetch(`/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
