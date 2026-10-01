// Local API client. The token comes from the page the server rendered for the app host only.
export interface Boot { token: string; port: number; appHost: string; fallbackHost: string }

const bootEl = document.getElementById('jsll-boot');
export const boot: Boot = bootEl ? JSON.parse(bootEl.textContent ?? '{}') : { token: '', port: Number(location.port), appHost: location.hostname, fallbackHost: 'localhost' };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public body: Record<string, unknown> = {}) {
    super(message);
  }
}

export async function api<T>(method: string, path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { 'x-jsll-token': boot.token, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
  } catch (error) {
    throw new ApiError(0, 'server-unreachable', error instanceof Error ? error.message : 'network error');
  }
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON error body */
  }
  if (!response.ok) throw new ApiError(response.status, String(data.error ?? `http-${response.status}`), String(data.message ?? response.statusText), data);
  return data as T;
}

export interface Bootstrap {
  version: string;
  schemaVersion: number;
  storeState: 'ready' | 'migration-failed' | 'newer-schema';
  migrationError: string | null;
  dataDir: string;
  exportsDir: string;
  port: number;
  node: string;
  platform: string;
  features: Record<string, { available: boolean; [k: string]: unknown }>;
  testHooks: boolean;
}
