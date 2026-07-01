const isCapacitor = typeof (window as any).Capacitor !== "undefined";
const API_BASE = isCapacitor ? "http://192.168.0.2:4000" : "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let authToken: string | null = localStorage.getItem("markt.token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("markt.token", token);
  else localStorage.removeItem("markt.token");
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Erro inesperado");
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
