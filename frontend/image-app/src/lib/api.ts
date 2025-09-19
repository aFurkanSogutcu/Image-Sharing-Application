// Tek yerden fetch: baseURL=/api ve token varsa Authorization ekler
const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch<T>(
    path: string,
    opts: RequestInit = {},
    token?: string | null
): Promise<T> {
    const headers = new Headers(opts.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${BASE}${path}`, { ...opts, headers });
    if (res.status === 204) return null as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data as T;
}
