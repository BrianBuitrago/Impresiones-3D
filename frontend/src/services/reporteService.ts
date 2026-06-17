import type { Colaborador, ReportData, ReportCreate } from '@/types/reportes';

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

export async function fetchColaboradores(token: string): Promise<Colaborador[]> {
  return handleRes(
    await fetch(`${API_URL}/auth/users?rol=colaborador`, { headers: headers(token) })
  );
}

export async function fetchReportes(token: string): Promise<ReportData[]> {
  return handleRes(
    await fetch(`${API_URL}/reports`, { headers: headers(token) })
  );
}

export async function fetchReporte(token: string, id: string): Promise<ReportData> {
  return handleRes(
    await fetch(`${API_URL}/reports/${id}`, { headers: headers(token) })
  );
}

export async function crearReporte(token: string, data: ReportCreate): Promise<ReportData> {
  return handleRes(
    await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(data),
    })
  );
}
