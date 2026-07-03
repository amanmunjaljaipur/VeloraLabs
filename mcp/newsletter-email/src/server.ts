#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createVeloraNewsletterClient } from "./client.js";

const baseUrl =
  process.env.VELORA_API_URL?.trim() ??
  process.env.AUTH_URL?.trim() ??
  process.env.NEXTAUTH_URL?.trim() ??
  "https://velora-labs-gamma.vercel.app";

const apiKey =
  process.env.NEWSLETTER_MCP_API_KEY?.trim() ??
  process.env.NEWS_PUBLISH_API_KEY?.trim() ??
  process.env.VELORA_API_KEY?.trim();

if (!apiKey) {
  console.error(
    "Set NEWSLETTER_MCP_API_KEY (or NEWS_PUBLISH_API_KEY) before starting the MCP server."
  );
  process.exit(1);
}

const client = createVeloraNewsletterClient({ baseUrl, apiKey });

const server = new McpServer({
  name: "velora-newsletter-email",
  version: "1.0.0",
});

server.tool(
  "newsletter_status",
  "Check newsletter email configuration, subscriber count, and current draft status.",
  {},
  async () => {
    const data = await client.status();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "newsletter_list_subscribers",
  "List all newsletter subscriber email addresses (signed-in users, sheet signups, and MCP additions).",
  {},
  async () => {
    const data = await client.listSubscribers();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "newsletter_get_draft",
  "Get the current newsletter draft with story summaries and mental-model tips.",
  {},
  async () => {
    const data = await client.getDraft();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "newsletter_generate",
  "Create a new newsletter draft from the latest AI news on the internet (RSS feeds, images, clarity lenses).",
  {},
  async () => {
    const data = await client.generate();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "newsletter_send_email",
  "Publish the current draft online and email the PDF newsletter to all subscribers via Resend.",
  {},
  async () => {
    const data = await client.send();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "newsletter_add_subscriber",
  "Add an email address to the newsletter subscriber list.",
  {
    email: z.string().email().describe("Subscriber email address"),
    source: z
      .string()
      .optional()
      .describe('Optional source label, e.g. "MCP" or "Partner list"'),
  },
  async ({ email, source }) => {
    const data = await client.addSubscriber(email, source);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Velora newsletter MCP server failed:", error);
  process.exit(1);
});