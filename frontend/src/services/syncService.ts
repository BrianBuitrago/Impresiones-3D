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

export interface SyncResultado {
  creados: number;
  eliminados: number;
  sin_cambios: number;
  detalle_creados: (string | number)[];
  detalle_eliminados: (string | number)[];
}

/** Trae al panel las filas nuevas de "Pedidos confirmados" en el Sheet y
 * elimina las que se hayan borrado ahí. No toca las que ya existen en ambos. */
export async function sincronizarPedidosConfirmados(token: string): Promise<SyncResultado> {
  return handleRes(
    await fetch(`${API_URL}/sync/pedidos-confirmados`, { method: 'POST', headers: headers(token) })
  );
}

/** Igual que arriba, para la pestaña "Inversiónes" del Sheet. */
export async function sincronizarInversiones(token: string): Promise<SyncResultado> {
  return handleRes(
    await fetch(`${API_URL}/sync/inversiones`, { method: 'POST', headers: headers(token) })
  );
}
