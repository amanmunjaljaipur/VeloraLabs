import {
  isServiceAccountConfigured,
  submitViaServiceAccount,
} from "@/lib/google-sheets-service";

type SheetSubmissionType = "booking" | "contact" | "newsletter";

interface SheetPayload {
  type: SheetSubmissionType;
  secret?: string;
  [key: string]: string | undefined;
}

async function submitViaWebhook(payload: SheetPayload): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return false;

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

export async function submitToGoogleSheet(payload: SheetPayload): Promise<boolean> {
  if (isServiceAccountConfigured()) {
    return submitViaServiceAccount(payload);
  }

  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    return submitViaWebhook(payload);
  }

  console.warn(
    "Google Sheets not configured — set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_WEBHOOK_URL"
  );
  return false;
}