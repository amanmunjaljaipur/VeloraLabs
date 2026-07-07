"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AnalyticsDashboardData, CountBucket } from "@/lib/analytics/service";
import {
  BarChart3,
  Bot,
  Eye,
  FileText,
  Loader2,
  TrendingUp,
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
  const maxTrend = Math.max(...data.pageViews.dailyTrend.map((d) => d.views), 1);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Analytics</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
          CRM pipeline, page views, and content coverage for Verlin Labs. Updated {generated}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "CRM leads", value: data.totals.leads, icon: Users },
          { label: "Page views", value: data.totals.pageViews, icon: Eye },
          { label: "Unique pages", value: data.totals.uniquePages, icon: TrendingUp },
          { label: "Follow-ups pending", value: data.totals.pendingFollowUps, icon: BarChart3 },
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
        <TrendCard label="New CRM leads" last7={data.recent.last7Days.leads} last30={data.recent.last30Days.leads} icon={Users} />
        <TrendCard label="Page views" last7={data.recent.last7Days.pageViews} last30={data.recent.last30Days.pageViews} icon={Eye} />
        <TrendCard label="Video comments" last7={data.recent.last7Days.videoComments} last30={data.recent.last30Days.videoComments} icon={Video} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Page views — top pages</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="pb-2 pr-4">Page</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Last 7d</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pageViews.topPages.map((page) => (
                    <tr key={page.path} className="border-t border-border/60">
                      <td className="py-2 pr-4 font-mono text-xs text-foreground">{page.path}</td>
                      <td className="py-2 pr-4">{page.views}</td>
                      <td className="py-2">{page.last7Days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.pageViews.topPages.length === 0 && (
                <p className="text-sm text-text-secondary">Page views will appear as visitors browse the site.</p>
              )}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">Daily trend (IST)</p>
              <div className="flex h-32 items-end gap-1">
                {data.pageViews.dailyTrend.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-accent-teal/80"
                      style={{ height: `${Math.max((day.views / maxTrend) * 100, 4)}%` }}
                      title={`${day.date}: ${day.views}`}
                    />
                  </div>
                ))}
              </div>
              {data.pageViews.dailyTrend.length === 0 && (
                <p className="text-sm text-text-secondary">No daily trend data yet.</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Leads by pipeline stage</h2>
          </div>
          <BucketList items={data.leadsByStage} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Leads by source</h2>
          </div>
          <BucketList items={data.leadsBySource} />
        </Card>

        <Card className={cn("p-5 lg:col-span-2")}>
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent-teal" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Chatbot FAQs by category</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <BucketList items={data.chatbotByCategory} />
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-text-secondary">
              <p className="font-medium text-foreground">Quick links</p>
              <p className="mt-2 leading-relaxed">
                {data.totals.chatbotFaqs} chatbot FAQs across {data.totals.cmsPages} CMS pages.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/crm" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-teal/40 hover:text-accent-teal">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Open CRM
                </Link>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-teal/40 hover:text-accent-teal">
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