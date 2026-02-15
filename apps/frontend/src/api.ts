const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'GET' });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ ok: boolean; message: string }> {
  return apiGet('/api/health');
}
