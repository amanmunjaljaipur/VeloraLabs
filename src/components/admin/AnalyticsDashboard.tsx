"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AnalyticsDashboardData, CountBucket } from "@/lib/analytics/service";
import {
  BarChart3,
  Bot,
  Calendar,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function BucketList({ items, emptyLabel = "No data yet" }: { items: CountBucket[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{item.label}</span>
            <span className="shrink-0 font-medium text-foreground">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent-teal transition-all"
              style={{ width: `${Math.max((item.count / max) * 100, 6)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendCard({
  label,
  last7,
  last30,
  icon: Icon,
}: {
  label: string;
  last7: number;
  last30: number;
  icon: typeof Users;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{last30}</p>
          <p className="mt-1 text-xs text-text-secondary">Last 30 days</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        <span className="font-medium text-foreground">{last7}</span> in the last 7 days
      </p>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((payload: AnalyticsDashboardData) => setData(payload))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (!data) {
    return <p className="py-12 text-center text-text-secondary">Unable to load analytics.</p>;
  }

  const generated = new Date(data.generatedAt).toLocaleString();

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Analytics</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
          Site activity snapshot for admins — bookings, leads, subscribers, learners, and content
          coverage. Updated {generated}.
        </p>
        {!data.sheetsConnected && (
          <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Google Sheets is not connected — booking and contact trends may be incomplete. People,
            subscribers, and on-site activity still load from the site database.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "People", value: data.totals.people, icon: Users },
          { label: "Bookings", value: data.totals.bookings, icon: Calendar },
          { label: "Contacts", value: data.totals.contacts, icon: MessageSquare },
          { label: "Subscribers", value: data.totals.subscribers, icon: Mail },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-secondary">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TrendCard
          label="Session bookings"
          last7={data.recent.last7Days.bookings}
          last30={data.recent.last30Days.bookings}
          icon={Calendar}
        />
        <TrendCard
          label="Contact inquiries"
          last7={data.recent.last7Days.contacts}
          last30={data.recent.last30Days.contacts}
          icon={MessageSquare}
        />
        <TrendCard
          label="Newsletter signups"
          last7={data.recent.last7Days.subscribers}
          last30={data.recent.last30Days.subscribers}
          icon={Mail}
        />
        <TrendCard
          label="Learner sign-ins"
          last7={data.recent.last7Days.signIns}
          last30={data.recent.last30Days.signIns}
          icon={Users}
        />
        <TrendCard
          label="Video comments"
          last7={data.recent.last7Days.videoComments}
          last30={data.recent.last30Days.videoComments}
          icon={Video}
        />
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Content coverage</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {data.totals.chatbotFaqs} FAQs
              </p>
              <p className="mt-1 text-xs text-text-secondary">{data.totals.cmsPages} CMS pages</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
              <Bot className="h-4 w-4" aria-hidden />
            </div>
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            <span className="font-medium text-foreground">{data.totals.videoComments}</span> session
            video comments total
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Bookings by audience</h2>
          </div>
          <BucketList items={data.bookingsByAudience} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Bookings by status</h2>
          </div>
          <BucketList items={data.bookingsByStatus} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">People by role</h2>
          </div>
          <BucketList items={data.peopleByRole} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Subscribers by source</h2>
          </div>
          <BucketList items={data.subscribersBySource} />
        </Card>

        <Card className={cn("p-5 lg:col-span-2")}>
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Chatbot FAQs by category</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <BucketList items={data.chatbotByCategory} />
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-text-secondary">
              <p className="font-medium text-foreground">Traffic & performance</p>
              <p className="mt-2 leading-relaxed">
                For page views, Web Vitals, and deployment metrics, open your Vercel project
                dashboard.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/admin/crm"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Open CRM
                </Link>
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  Vercel dashboard
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}