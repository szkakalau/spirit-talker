function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, '');
  return '/api';
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path.startsWith('/') ? path : `/${path}`}`);
  return parseJson<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(res);
}
