/**
 * Common API utility functions
 */

export interface ApiRequestOptions extends RequestInit {
  queryParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * Helper to build query string from params
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const esc = encodeURIComponent;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
}

/**
 * Generic API fetch wrapper
 */
export async function apiFetch<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { queryParams, headers, ...rest } = options;
  const fullUrl = url + buildQueryString(queryParams);

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...rest,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}