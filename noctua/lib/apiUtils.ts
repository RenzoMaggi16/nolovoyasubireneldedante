/**
 * lib/apiUtils.ts
 * Utilidades para llamadas a APIs externas con resiliencia.
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoff?: number;
}

export async function fetchWithResilience(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 3,
    backoff = 1000,
    ...fetchOptions
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si es error 5xx, reintentar
      if (response.status >= 500 && attempt < retries) {
        const delay = backoff * Math.pow(2, attempt);
        console.warn(`API Error ${response.status} on ${url}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error.name === 'AbortError') {
        console.error(`API Timeout on ${url}`);
      }

      // No reintentar si es AbortError o si ya no quedan intentos
      if (attempt >= retries || error.name === 'AbortError') {
        break;
      }

      const delay = backoff * Math.pow(2, attempt);
      console.warn(`Fetch error on ${url}: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}
