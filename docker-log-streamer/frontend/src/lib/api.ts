// simple fetch wrapper
export const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:5010';

async function request<T>(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function listContainers() {
  return request<Array<any>>('/api/containers');
}
export function startContainer(id: string) { return request(`/api/containers/${id}/start`, { method: 'POST' }); }
export function stopContainer(id: string) { return request(`/api/containers/${id}/stop`, { method: 'POST' }); }
export function restartContainer(id: string) { return request(`/api/containers/${id}/restart`, { method: 'POST' }); }
export function getContainerStats(id: string) { return request(`/api/containers/${id}/stats`); }
