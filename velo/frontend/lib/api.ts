const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    // Guard: sem isso, a URL viraria "undefined/..." e o erro apareceria como um 404 confuso.
    throw new Error(
      "Configuração ausente: NEXT_PUBLIC_API_URL não está definida no ambiente de build. " +
        "Defina-a no .env.local (dev) ou nas Environment Variables da Vercel (produção) e refaça o build."
    );
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("A requisição demorou demais. Tente novamente.");
    }
    throw new Error("Erro de conexão. Verifique sua internet.");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
