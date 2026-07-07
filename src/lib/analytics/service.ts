import { CMS_PAGES } from "@/lib/cms/registry";
import { loadCrmDashboard } from "@/lib/crm/service";
import { getPageViewSummary, type PageViewSummary } from "@/lib/analytics/page-views";
import { readTrainingDataset } from "@/lib/chat/training-store";
import { getAllVideoComments } from "@/lib/video-comments";

export interface CountBucket {
  label: string;
  count: number;
}

export interface RecentActivity {
  last7Days: {
    leads: number;
    pageViews: number;
    videoComments: number;
  };
  last30Days: {
    leads: number;
    pageViews: number;
    videoComments: number;
  };
}

export interface AnalyticsDashboardData {
  generatedAt: string;
  totals: {
    leads: number;
    pendingFollowUps: number;
    pageViews: number;
    uniquePages: number;
    videoComments: number;
    chatbotFaqs: number;
    cmsPages: number;
  };
  recent: RecentActivity;
  leadsByStage: CountBucket[];
  leadsBySource: CountBucket[];
  chatbotByCategory: CountBucket[];
  pageViews: PageViewSummary;
}

function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function countSince(dates: Array<string | null | undefined>, days: number): number {
  const cutoff = daysAgoMs(days);
  return dates.filter((value) => {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time >= cutoff;
  }).length;
}

function bucketFromRecord(record: Record<string, number>): CountBucket[] {
  return Object.entries(record)
    .map(([label, count]) => ({ label, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function loadAnalyticsDashboard(): Promise<AnalyticsDashboardData> {
  const crm = await loadCrmDashboard();
  const comments = getAllVideoComments();
  const training = readTrainingDataset();
  const enabledFaqs = training.entries.filter((entry) => entry.enabled);
  const pageViews = getPageViewSummary();

  const leadTimestamps = crm.leads.map((lead) => lead.createdAt);
  const commentTimestamps = comments.map((comment) => comment.createdAt);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      leads: crm.stats.total,
      pendingFollowUps: crm.stats.pendingFollowUps,
      pageViews: pageViews.totalViews,
      uniquePages: pageViews.uniquePages,
      videoComments: comments.length,
      chatbotFaqs: enabledFaqs.length,
      cmsPages: CMS_PAGES.length,
    },
    recent: {
      last7Days: {
        leads: countSince(leadTimestamps, 7),
        pageViews: pageViews.last7Days,
        videoComments: countSince(commentTimestamps, 7),
      },
      last30Days: {
        leads: countSince(leadTimestamps, 30),
        pageViews: pageViews.last30Days,
        videoComments: countSince(commentTimestamps, 30),
      },
    },
    leadsByStage: crm.funnel.map((item) => ({ label: item.label, count: item.count })),
    leadsBySource: bucketFromRecord(crm.stats.bySource),
    chatbotByCategory: bucketFromRecord(
      enabledFaqs.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.category] = (acc[entry.category] ?? 0) + 1;
        return acc;
      }, {})
    ),
    pageViews,
  };
}