export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { hydrateAllFromBlob } = await import("@/lib/data-store");
    await hydrateAllFromBlob();
  }
}