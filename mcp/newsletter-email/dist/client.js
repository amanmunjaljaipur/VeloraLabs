async function request(options, path, init) {
    const url = `${options.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    const data = (await res.json().catch(() => ({})));
    if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status}) for ${path}`);
    }
    return data;
}
export function createVeloraNewsletterClient(options) {
    return {
        status: () => request(options, "/api/mcp/newsletter/status"),
        listSubscribers: () => request(options, "/api/mcp/newsletter/subscribers"),
        getDraft: () => request(options, "/api/mcp/newsletter/draft"),
        generate: () => request(options, "/api/mcp/newsletter/generate", {
            method: "POST",
            body: "{}",
        }),
        send: () => request(options, "/api/mcp/newsletter/send", {
            method: "POST",
            body: "{}",
        }),
        addSubscriber: (email, source) => request(options, "/api/mcp/newsletter/subscribers", {
            method: "POST",
            body: JSON.stringify({ email, source }),
        }),
    };
}
