import { buildCrmStats, readCrmStore } from "@/lib/crm/store";
import type { CrmDashboardData } from "@/lib/crm/types";
import { CRM_STAGES, CRM_STAGE_LABELS } from "@/lib/crm/types";

export type { CrmDashboardData } from "@/lib/crm/types";

export async function loadCrmDashboard(): Promise<CrmDashboardData> {
  const store = readCrmStore();
  const stats = buildCrmStats(store);

  return {
    lastSyncedAt: store.lastSyncedAt,
    leads: store.leads.filter((lead) => !lead.deletedAt),
    activities: store.activities.slice(0, 200),
    followUps: store.followUps.filter((item) => item.status === "pending"),
    stats,
    funnel: CRM_STAGES.map((stage) => ({
      stage,
      label: CRM_STAGE_LABELS[stage],
      count: stats.byStage[stage],
    })),
  };
}