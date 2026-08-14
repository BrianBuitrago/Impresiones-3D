const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function headers(token?: string | null): Record<string, string> {
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

export async function fetchQuotes(token: string): Promise<any[]> {
  return handleRes(
    await fetch(`${API_URL}/quotes`, { headers: headers(token) })
  );
}

export async function crearQuote(data: any, token?: string | null): Promise<any> {
  return handleRes(
    await fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(data),
    })
  );
}

export async function actualizarQuote(token: string, id: string, data: any): Promise<any> {
  return handleRes(
    await fetch(`${API_URL}/quotes/${id}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(data),
    })
  );
}

export async function actualizarSubEstado(token: string, id: string, subEstado: string): Promise<any> {
  return handleRes(
    await fetch(`${API_URL}/quotes/${id}/subestado`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ subEstado }),
    })
  );
}

export async function fetchMyQuotes(token: string): Promise<any[]> {
  return handleRes(
    await fetch(`${API_URL}/quotes/my`, { headers: headers(token) })
  );
}
