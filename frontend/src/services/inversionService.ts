import type { Inversion, InversionInput } from '@/types/inversiones';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function headers(token: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchInversiones(token: string): Promise<Inversion[]> {
  return handleRes(
    await fetch(`${API_URL}/inversiones`, { headers: headers(token) })
  );
}

export async function crearInversion(token: string, data: InversionInput): Promise<Inversion> {
  return handleRes(
    await fetch(`${API_URL}/inversiones`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(data),
    })
  );
}

export async function actualizarInversion(token: string, id: string, data: Partial<InversionInput>): Promise<Inversion> {
  return handleRes(
    await fetch(`${API_URL}/inversiones/${id}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(data),
    })
  );
}

export async function eliminarInversion(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/inversiones/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error ${res.status}`);
  }
}
