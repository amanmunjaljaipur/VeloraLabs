const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("Set RESEND_API_KEY before running this script.");
  process.exit(1);
}

const listRes = await fetch("https://api.resend.com/domains", {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const list = await listRes.json();

if (!listRes.ok) {
  console.error("Failed to list domains:", list);
  process.exit(1);
}

const domain = list.data?.[0];
if (!domain) {
  console.error("No domains found in Resend.");
  process.exit(1);
}

const detailRes = await fetch(`https://api.resend.com/domains/${domain.id}`, {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const detail = await detailRes.json();

console.log(`Domain: ${domain.name}`);
console.log(`Status before verify: ${detail.status}`);

if (detail.status !== "verified") {
  console.log("\nAdd these DNS records at your domain registrar (GoDaddy for verlinlabs.com):\n");
  for (const record of detail.records ?? []) {
    console.log(`- Type: ${record.type}`);
    console.log(`  Host/Name: ${record.name}`);
    console.log(`  Value: ${record.value}`);
    if (record.priority != null) console.log(`  Priority: ${record.priority}`);
    console.log("");
  }

  const verifyRes = await fetch(`https://api.resend.com/domains/${domain.id}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const verifyBody = await verifyRes.json();
  console.log("Verify response:", JSON.stringify(verifyBody, null, 2));

  const refreshedRes = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const refreshed = await refreshedRes.json();
  console.log(`Status after verify: ${refreshed.status}`);
} else {
  console.log("Domain is already verified.");
}