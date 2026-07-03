import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadNewsletterDraft, sendNewsletterDraft } from "@/lib/newsletter-draft";
import { generateNewsletterDraftFromWeb } from "@/lib/newsletter-generator";
import { publishWeeklyNewsletterViaMcp } from "@/lib/newsletter-publish-weekly";
import {
  ensureNewsletterSubscriber,
  getNewsletterSubscriberEmails,
} from "@/lib/newsletter-subscribers";
import { z } from "zod";

export function createNewsletterMcpServer(): McpServer {
  const server = new McpServer({
    name: "velora-newsletter-email",
    version: "1.0.0",
  });

  server.tool(
    "newsletter_status",
    "Check newsletter email configuration, subscriber count, and current draft status.",
    {},
    async () => {
      const draft = await loadNewsletterDraft();
      const subscribers = await getNewsletterSubscriberEmails();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                email: {
                  resendConfigured: Boolean(process.env.RESEND_API_KEY),
                  fromAddress:
                    process.env.NEWSLETTER_FROM_EMAIL ??
                    process.env.RESEND_FROM_EMAIL ??
                    "Verlin Labs <onboarding@resend.dev>",
                },
                subscribers: { count: subscribers.length },
                draft: draft
                  ? {
                      id: draft.id,
                      title: draft.title,
                      storyCount: draft.stories.length,
                      status: draft.status,
                      updatedAt: draft.updatedAt,
                    }
                  : null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_list_subscribers",
    "List all newsletter subscriber email addresses.",
    {},
    async () => {
      const subscribers = await getNewsletterSubscriberEmails();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, count: subscribers.length, subscribers }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_get_draft",
    "Get the current newsletter draft with story summaries and mental-model tips.",
    {},
    async () => {
      const draft = await loadNewsletterDraft();
      if (!draft || draft.status === "sent") {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, draft: null }, null, 2) }],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                draft: {
                  id: draft.id,
                  title: draft.title,
                  intro: draft.intro,
                  storyCount: draft.stories.length,
                  status: draft.status,
                  updatedAt: draft.updatedAt,
                  stories: draft.stories.map((story) => ({
                    title: story.title,
                    source: story.source,
                    summary: story.summary,
                    url: story.url,
                    mentalModelTip: story.mentalModelTip,
                  })),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_generate",
    "Create a newsletter draft from the latest AI news on the internet.",
    {},
    async () => {
      const draft = await generateNewsletterDraftFromWeb();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                draft: {
                  id: draft.id,
                  title: draft.title,
                  intro: draft.intro,
                  storyCount: draft.stories.length,
                  status: draft.status,
                  updatedAt: draft.updatedAt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_send_email",
    "Publish the current draft online and email the PDF newsletter to all subscribers.",
    {},
    async () => {
      const draft = await loadNewsletterDraft();
      if (!draft || draft.status === "sent") {
        throw new Error("No newsletter draft to send. Generate one first.");
      }
      const result = await sendNewsletterDraft(draft);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                edition: {
                  title: result.edition.title,
                  slug: result.edition.slug,
                  itemCount: result.edition.itemCount,
                  publicUrl: `/newsletter/weekly?edition=${result.edition.slug}`,
                },
                email: result.email,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_publish_weekly",
    "Generate a fresh weekly blog/newsletter from latest AI news, publish it on the site, and email the PDF to all subscribers. Use this for scheduled automation.",
    {},
    async () => {
      const result = await publishWeeklyNewsletterViaMcp();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, ...result }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "newsletter_add_subscriber",
    "Add an email address to the newsletter subscriber list.",
    {
      email: z.string().email().describe("Subscriber email address"),
      source: z.string().optional().describe("Optional source label"),
    },
    async ({ email, source }) => {
      const record = await ensureNewsletterSubscriber(email, source ?? "MCP");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, subscriber: record }, null, 2) }],
      };
    }
  );

  return server;
}