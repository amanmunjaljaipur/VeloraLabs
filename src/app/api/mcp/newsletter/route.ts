import { verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { createNewsletterMcpServer } from "@/lib/newsletter-mcp-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MCP_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

function getPublicMcpUrl(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/api/mcp/newsletter`;
}

function discoveryResponse(request: NextRequest) {
  const mcpUrl = getPublicMcpUrl(request);
  return NextResponse.json(
    {
      name: "velora-newsletter-email",
      version: "1.0.0",
      description:
        "Verlin Labs newsletter MCP - generate AI digests, email PDF editions, and manage subscribers.",
      transport: "streamable-http",
      mcpUrl,
      authentication: {
        type: "api-key",
        headers: ["Authorization: Bearer <NEWSLETTER_MCP_API_KEY>", "x-api-key: <NEWSLETTER_MCP_API_KEY>"],
      },
      tools: [
        "newsletter_status",
        "newsletter_list_subscribers",
        "newsletter_get_draft",
        "newsletter_generate",
        "newsletter_send_email",
        "newsletter_publish_weekly",
        "newsletter_add_subscriber",
      ],
      scheduledTask: {
        description: "Grok scheduled task - publish and email the Verlin Labs weekly blog",
        interval: "7d",
        prompt:
          "Use the Verlin Labs newsletter MCP. Call newsletter_publish_weekly to generate a fresh edition from the latest AI news, publish it on the site, and email the PDF to all subscribers. Report the edition title, public URL, and how many emails were sent.",
        restFallback: {
          method: "POST",
          url: `${mcpUrl}/publish-weekly`,
          headers: { Authorization: "Bearer ${NEWSLETTER_MCP_API_KEY}" },
        },
      },
      restApiBase: mcpUrl.replace(/\/newsletter$/, "/newsletter"),
      examples: {
        grok: {
          transport: "http",
          url: mcpUrl,
          headers: { Authorization: "Bearer ${NEWSLETTER_MCP_API_KEY}" },
        },
        claudeDesktop: {
          mcpServers: {
            "velora-newsletter": {
              url: mcpUrl,
              headers: { Authorization: "Bearer YOUR_API_KEY" },
            },
          },
        },
      },
    },
    { headers: MCP_CORS_HEADERS }
  );
}

async function handleMcpProtocol(request: NextRequest): Promise<Response> {
  if (!verifyNewsletterMcpKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized - provide Authorization: Bearer <key> or x-api-key header" },
      { status: 401, headers: MCP_CORS_HEADERS }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = createNewsletterMcpServer();
  await server.connect(transport);

  const response = await transport.handleRequest(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MCP_CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const isMcpClient =
    accept.includes("text/event-stream") ||
    accept.includes("application/json") ||
    request.headers.get("mcp-protocol-version");

  if (!isMcpClient && !verifyNewsletterMcpKey(request)) {
    return discoveryResponse(request);
  }

  return handleMcpProtocol(request);
}

export async function POST(request: NextRequest) {
  return handleMcpProtocol(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpProtocol(request);
}