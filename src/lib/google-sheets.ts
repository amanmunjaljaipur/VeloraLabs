type SheetSubmissionType = "booking" | "contact" | "newsletter";

interface SheetPayload {
  type: SheetSubmissionType;
  secret?: string;
  [key: string]: string | undefined;
}

export async function submitToGoogleSheet(payload: SheetPayload): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL not set — skipping sheet sync");
    return false;
  }

  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret }),
      cache: "no-store",
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}