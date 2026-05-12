function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, '');
  return '/api';
}

function responseLooksLikeHtml(body: string): boolean {
  const t = body.trimStart();
  return t.startsWith('<');
}

function htmlInsteadOfJsonHint(): string {
  return (
    'Server returned a web page (HTML) instead of JSON. ' +
    'Local preview: run the API on port 3000 and use the Vite /api proxy, or set VITE_API_BASE_URL. ' +
    'Hosted static sites (e.g. Vercel): set VITE_API_BASE_URL at build time to your API origin so /api is not rewritten to index.html.'
  );
}

/** Browsers report CORS, DNS, TLS, and network drops as TypeError / "Failed to fetch". */
function wrapFetchFailure(url: string, err: unknown): never {
  if (err instanceof TypeError) {
    throw new Error(
      `Failed to reach the API (${url}). Often: server down or cold-start (wait ~60s on Render free), ` +
        `CORS (set CORS_ORIGIN on the API to include this site’s origin), HTTPS page calling HTTP API (mixed content), ` +
        `wrong VITE_API_BASE_URL, or an extension blocking requests. (${err.message})`,
    );
  }
  throw err;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    if (responseLooksLikeHtml(text)) throw new Error(`${res.status} ${res.statusText}: ${htmlInsteadOfJsonHint()}`);
    throw new Error(text || res.statusText);
  }
  if (!text) return {} as T;
  if (responseLooksLikeHtml(text)) throw new Error(htmlInsteadOfJsonHint());
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON from ${res.url}: ${reason}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    wrapFetchFailure(url, e);
  }
  return parseJson<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    wrapFetchFailure(url, e);
  }
  return parseJson<T>(res);
}
