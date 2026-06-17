import type { Colaborador, MonthlyReport, MonthlyReportCreate } from '@/types/reportes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function authHeaders(token: string | null): Promise<HeadersInit> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchColaboradores(token: string): Promise<Colaborador[]> {
  const res = await fetch(`${API_URL}/auth/users`, {
    headers: await authHeaders(token),
  });
  const users: Colaborador[] = await handleResponse(res);
  return users.filter(u => u.rol === 'colaborador');
}

export async function fetchReportes(token: string): Promise<MonthlyReport[]> {
  const res = await fetch(`${API_URL}/reports`, {
    headers: await authHeaders(token),
  });
  return handleResponse<MonthlyReport[]>(res);
}

export async function fetchReporte(token: string, id: string): Promise<MonthlyReport> {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    headers: await authHeaders(token),
  });
  return handleResponse<MonthlyReport>(res);
}

export async function crearReporte(token: string, data: MonthlyReportCreate): Promise<MonthlyReport> {
  const res = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<MonthlyReport>(res);
}

export async function actualizarReporte(token: string, id: string, data: Partial<MonthlyReportCreate>): Promise<MonthlyReport> {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    method: 'PUT',
    headers: await authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<MonthlyReport>(res);
}
