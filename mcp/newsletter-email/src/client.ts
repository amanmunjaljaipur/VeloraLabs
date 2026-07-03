export interface VeloraNewsletterClientOptions {
  baseUrl: string;
  apiKey: string;
}

async function request<T>(
  options: VeloraNewsletterClientOptions,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${options.baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status}) for ${path}`);
  }
  return data;
}

export function createVeloraNewsletterClient(options: VeloraNewsletterClientOptions) {
  return {
    status: () => request<Record<string, unknown>>(options, "/api/mcp/newsletter/status"),
    listSubscribers: () =>
      request<{ subscribers: string[]; count: number }>(options, "/api/mcp/newsletter/subscribers"),
    getDraft: () => request<Record<string, unknown>>(options, "/api/mcp/newsletter/draft"),
    generate: () =>
      request<Record<string, unknown>>(options, "/api/mcp/newsletter/generate", {
        method: "POST",
        body: "{}",
      }),
    send: () =>
      request<Record<string, unknown>>(options, "/api/mcp/newsletter/send", {
        method: "POST",
        body: "{}",
      }),
    addSubscriber: (email: string, source?: string) =>
      request<Record<string, unknown>>(options, "/api/mcp/newsletter/subscribers", {
        method: "POST",
        body: JSON.stringify({ email, source }),
      }),
  };
}