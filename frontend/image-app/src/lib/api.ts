// src/lib/api.ts

const BASE = "/api";
export const MEDIA_BASE = "";

function normalizeErrorMessage(data: any, status: number): string {
  if (!data) return `HTTP ${status}`;

  // FastAPI: detail string
  if (typeof data.detail === "string") {
    return data.detail;
  }

  // FastAPI: detail object -> { message, label, scores }
  if (data.detail && typeof data.detail === "object") {
    if (typeof data.detail.message === "string") {
      return data.detail.message;
    }
  }

  // Bazı endpointler { message: "..." } döndürebilir
  if (typeof data.message === "string") {
    return data.message;
  }

  // Pydantic validation errors: detail: [{ msg: "..." }]
  if (Array.isArray(data.detail)) {
    const msgs = data.detail
      .map((x: any) => x?.msg)
      .filter(Boolean);
    if (msgs.length) return msgs.join(" | ");
  }

  return `HTTP ${status}`;
}

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
    const msg = normalizeErrorMessage(data, res.status);
    throw new Error(msg); // 🔴 artık HER ZAMAN string
  }

  return data as T;
}
