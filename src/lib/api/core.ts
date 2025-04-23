/**
 * Common API utility functions
 */

export interface ApiRequestOptions extends RequestInit {
  queryParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * Helper to build query string from params
 */
export function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const esc = encodeURIComponent;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
}

// API key from environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';

/**
 * Generic API fetch wrapper
 */
export async function apiFetch<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { queryParams = {}, headers, ...rest } = options;

  // Add API key for Google Books API requests
  let updatedQueryParams = { ...queryParams };
  if (url.includes('googleapis.com/books') && API_KEY) {
    updatedQueryParams.key = API_KEY;
  }

  const fullUrl = url + buildQueryString(updatedQueryParams);

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
