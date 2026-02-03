const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

const DEFAULT_TIMEOUT_MS = 45000;

export interface RequestError extends Error {
  status?: number;
  responseBody?: unknown;
}

export function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path.startsWith('http') ? path : buildUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseBody = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: RequestError = new Error('Request failed');
      error.status = response.status;
      error.responseBody = responseBody;
      throw error;
    }

    return responseBody as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
