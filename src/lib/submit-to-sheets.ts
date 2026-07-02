export async function submitForm(data: Record<string, string>) {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { ok: false, synced: false };
    const body = (await res.json()) as { success?: boolean; synced?: boolean };
    return { ok: body.success === true, synced: body.synced === true };
  } catch {
    return { ok: false, synced: false };
  }
}