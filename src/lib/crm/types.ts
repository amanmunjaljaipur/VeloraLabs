export const CRM_STAGES = [
  "new",
  "contacted",
  "session_booked",
  "session_attended",
  "interested",
  "enrolled",
  "lost",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new: "New",
  contacted: "Contacted",
  session_booked: "Session booked",
  session_attended: "Session attended",
  interested: "Interested",
  enrolled: "Enrolled",
  lost: "Lost",
};

export const CRM_SOURCES = [
  "free_session",
  "contact_form",
  "newsletter",
  "course_inquiry",
  "manual",
  "referral",
  "known_user",
] as const;

export type CrmSource = (typeof CRM_SOURCES)[number];

export const CRM_SOURCE_LABELS: Record<CrmSource, string> = {
  free_session: "Free session",
  contact_form: "Contact form",
  newsletter: "Newsletter",
  course_inquiry: "Course inquiry",
  manual: "Manual",
  referral: "Referral",
  known_user: "Signed-in user",
};

export type CrmActivityType =
  | "note"
  | "stage_change"
  | "booking"
  | "contact"
  | "newsletter"
  | "call"
  | "email"
  | "sync";

export interface CrmLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: CrmSource;
  stage: CrmStage;
  audience: string;
  audienceLabel: string;
  notes: string;
  assignedTo: string;
  tags: string[];
  sessionDate: string;
  sessionTime: string;
  sessionTitle: string;
  bookingId: string;
  bookingStatus: string;
  isSubscriber: boolean;
  learnerRole: string;
  externalRefs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CrmActivity {
  id: string;
  leadId: string;
  type: CrmActivityType;
  body: string;
  meta: Record<string, string>;
  createdAt: string;
  createdBy: string;
}

export interface CrmFollowUp {
  id: string;
  leadId: string;
  dueAt: string;
  reason: string;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
  createdBy: string;
}

export interface CrmDataStore {
  version: number;
  updatedAt: string;
  lastSyncedAt: string | null;
  leads: CrmLead[];
  activities: CrmActivity[];
  followUps: CrmFollowUp[];
}

export interface CrmLeadInput {
  name?: string;
  email: string;
  phone?: string;
  source?: CrmSource;
  stage?: CrmStage;
  audience?: string;
  audienceLabel?: string;
  notes?: string;
  assignedTo?: string;
  tags?: string[];
  sessionDate?: string;
  sessionTime?: string;
  sessionTitle?: string;
  bookingId?: string;
  bookingStatus?: string;
  isSubscriber?: boolean;
  learnerRole?: string;
}

export interface CrmDashboardStats {
  total: number;
  byStage: Record<CrmStage, number>;
  bySource: Record<string, number>;
  pendingFollowUps: number;
  dueToday: number;
}

export interface CrmDashboardData {
  lastSyncedAt: string | null;
  leads: CrmLead[];
  activities: CrmActivity[];
  followUps: CrmFollowUp[];
  stats: CrmDashboardStats;
  funnel: Array<{ stage: CrmStage; label: string; count: number }>;
}