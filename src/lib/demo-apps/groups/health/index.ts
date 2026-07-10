/**
 * Demo app categories: health
 * Deploy unit: src/lib/demo-apps/groups/health/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
{
    slug: "fitness-trackers",
    name: "Fitness & Activity Trackers",
    group: "health",
    groupLabel: G.health,
    tagline: "Runs, gym, metrics",
    description: "Strava-style activities, goals, coach plans, device sync.",
    examples: ["Strava", "Nike Run Club", "Garmin"],
    productKind: "generic",
    brandName: "Verlin Fit",
    roles: [
      { id: "athlete", label: "Athlete", description: "Log workouts", canCreate: true, isDefault: true },
      { id: "coach", label: "Coach", description: "Training plans", canCreate: true, canManage: true },
      { id: "admin", label: "Club admin", description: "Challenges", canManage: true },
    ],
    entities: [
      ent("activity", "Activity", ["Logged", "PR", "Draft", "Flagged"], ["title", "amount", "description", "status"], [
        { title: "Morning run", amount: 5.2, description: "km", status: "Logged" },
        { title: "Tempo 10k", amount: 10, description: "PR", status: "PR" },
        { title: "Gym draft", amount: 0, description: "Incomplete", status: "Draft" },
        { title: "Suspicious GPS", amount: 42, description: "Flagged", status: "Flagged" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Week stats" },
      { id: "activities", title: "Activities", type: "board", entityId: "activity", description: "Feed" },
      { id: "log", title: "Log workout", type: "form", entityId: "activity", description: "Add" },
      { id: "coach", title: "Coach desk", type: "list", entityId: "activity", roleIds: ["coach"], description: "Athletes" },
      { id: "admin", title: "Club", type: "settings", roleIds: ["admin"], description: "Challenges" },
      { id: "settings", title: "Devices", type: "settings", description: "Sync" },
    ],
    workflows: [
      { id: "wf-log", name: "Log run", description: "Athlete logs", roleId: "athlete", steps: ["Log", "Logged"], moduleId: "log", entityId: "activity" },
      { id: "wf-coach", name: "Review athlete", description: "Coach checks", roleId: "coach", steps: ["Coach desk"], moduleId: "coach" },
      { id: "wf-adm", name: "Run challenge", description: "Admin club", roleId: "admin", steps: ["Club"], moduleId: "admin" },
    ],
  },
  {
    slug: "meditation-mindfulness",
    name: "Meditation & Mindfulness",
    group: "health",
    groupLabel: G.health,
    tagline: "Stress & sleep audio",
    description: "Headspace-style sessions, streaks, sleep casts, coach packs.",
    examples: ["Headspace", "Calm", "Waking Up"],
    productKind: "generic",
    brandName: "Verlin Calm",
    roles: [
      { id: "member", label: "Member", description: "Meditate daily", canCreate: true, isDefault: true },
      { id: "guide", label: "Guide", description: "Publish sessions", canCreate: true, canManage: true },
      { id: "admin", label: "Content admin", description: "Catalog", canManage: true },
    ],
    entities: [
      ent("session", "Session", ["Available", "Completed", "Favorited", "Locked"], ["title", "description", "status"], [
        { title: "3-min breath", description: "Basics", status: "Completed" },
        { title: "Sleep cast", description: "Night", status: "Favorited" },
        { title: "Anxiety pack", description: "Day 2", status: "Available" },
        { title: "Pro series", description: "Premium", status: "Locked" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Suggested" },
      { id: "library", title: "Library", type: "board", entityId: "session", description: "All" },
      { id: "play", title: "Start session", type: "form", entityId: "session", description: "Play" },
      { id: "create", title: "Publish session", type: "form", entityId: "session", roleIds: ["guide"], description: "Guide" },
      { id: "admin", title: "Catalog", type: "list", entityId: "session", roleIds: ["admin"], description: "Admin" },
      { id: "settings", title: "Settings", type: "settings", description: "Reminders" },
    ],
    workflows: [
      { id: "wf-med", name: "Complete session", description: "Member meditates", roleId: "member", steps: ["Start", "Completed"], moduleId: "play", entityId: "session" },
      { id: "wf-guide", name: "Publish guide", description: "Guide adds session", roleId: "guide", steps: ["Publish", "Available"], moduleId: "create", entityId: "session" },
      { id: "wf-adm", name: "Curate catalog", description: "Admin manages", roleId: "admin", steps: ["Catalog"], moduleId: "admin" },
    ],
  },
  {
    slug: "calorie-nutrition",
    name: "Calorie Tracking & Nutrition",
    group: "health",
    groupLabel: G.health,
    tagline: "Meals & macros",
    description: "MyFitnessPal-style diary, foods, goals, coach review.",
    examples: ["MyFitnessPal", "Lose It!", "Cronometer"],
    productKind: "generic",
    brandName: "Verlin Nutri",
    roles: [
      { id: "user", label: "User", description: "Log meals", canCreate: true, isDefault: true },
      { id: "coach", label: "Nutrition coach", description: "Review diaries", canManage: true },
      { id: "admin", label: "Food DB admin", description: "Food catalog", canManage: true, canCreate: true },
    ],
    entities: [
      ent("meal", "Meal log", ["Logged", "Over goal", "Under goal", "Draft"], ["title", "calories", "description", "status"], [
        { title: "Breakfast", calories: 420, description: "Oats", status: "Under goal" },
        { title: "Lunch", calories: 780, description: "Thali", status: "Logged" },
        { title: "Dinner", calories: 1100, description: "Pizza", status: "Over goal" },
        { title: "Snack draft", calories: 0, description: "TBD", status: "Draft" },
      ]),
    ],
    modules: [
      { id: "home", title: "Diary", type: "dashboard", description: "Today macros" },
      { id: "meals", title: "Meals", type: "board", entityId: "meal", description: "Log" },
      { id: "add", title: "Log meal", type: "form", entityId: "meal", description: "Add food" },
      { id: "coach", title: "Coach review", type: "list", entityId: "meal", roleIds: ["coach"], description: "Clients" },
      { id: "admin", title: "Food DB", type: "list", entityId: "meal", roleIds: ["admin"], description: "Catalog" },
      { id: "settings", title: "Goals", type: "settings", description: "Calories" },
    ],
    workflows: [
      { id: "wf-log", name: "Log meal", description: "User logs food", roleId: "user", steps: ["Log meal", "Logged"], moduleId: "add", entityId: "meal" },
      { id: "wf-coach", name: "Review diary", description: "Coach comments", roleId: "coach", steps: ["Coach review"], moduleId: "coach" },
      { id: "wf-adm", name: "Maintain foods", description: "Admin DB", roleId: "admin", steps: ["Food DB"], moduleId: "admin" },
    ],
  },
  {
    slug: "menstrual-tracking",
    name: "Menstrual & Period Tracking",
    group: "health",
    groupLabel: G.health,
    tagline: "Cycles & fertility",
    description: "Flo-style cycle logs, predictions, symptoms, privacy controls.",
    examples: ["Flo", "Clue"],
    productKind: "generic",
    brandName: "Verlin Cycle",
    roles: [
      { id: "user", label: "User", description: "Log cycle", canCreate: true, isDefault: true },
      { id: "partner", label: "Shared partner", description: "Limited view", canCreate: false },
      { id: "clinician", label: "Clinician", description: "Shared reports", canManage: true },
    ],
    entities: [
      ent("log", "Day log", ["Period", "Fertile", "PMS", "Normal"], ["title", "description", "status"], [
        { title: "Day 1", description: "Period start", status: "Period" },
        { title: "Day 12", description: "Fertile window", status: "Fertile" },
        { title: "Day 24", description: "PMS", status: "PMS" },
        { title: "Day 8", description: "Normal", status: "Normal" },
      ]),
    ],
    modules: [
      { id: "home", title: "Calendar", type: "dashboard", description: "Predictions" },
      { id: "logs", title: "Logs", type: "board", entityId: "log", description: "History" },
      { id: "add", title: "Log today", type: "form", entityId: "log", description: "Symptoms" },
      { id: "share", title: "Sharing", type: "settings", description: "Partner/clinician" },
      { id: "clinic", title: "Clinic view", type: "list", entityId: "log", roleIds: ["clinician"], description: "Reports" },
      { id: "settings", title: "Privacy", type: "settings", description: "Lock" },
    ],
    workflows: [
      { id: "wf-log", name: "Log day", description: "User logs symptoms", roleId: "user", steps: ["Log today", "Saved"], moduleId: "add", entityId: "log" },
      { id: "wf-part", name: "View share", description: "Partner limited", roleId: "partner", steps: ["Calendar"], moduleId: "home" },
      { id: "wf-clin", name: "Review report", description: "Clinician views", roleId: "clinician", steps: ["Clinic view"], moduleId: "clinic" },
    ],
  },
  {
    slug: "telemedicine",
    name: "Telemedicine & Digital Health",
    group: "health",
    groupLabel: G.health,
    tagline: "Video visits & charts",
    description: "Teladoc/Zocdoc-style booking, visits, prescriptions, clinician queue.",
    examples: ["Teladoc", "Zocdoc", "MyChart"],
    productKind: "booking",
    brandName: "Verlin Care",
    roles: [
      { id: "patient", label: "Patient", description: "Book visits", canCreate: true, isDefault: true },
      { id: "doctor", label: "Doctor", description: "Consult queue", canManage: true, canCreate: true },
      { id: "ops", label: "Care ops", description: "Scheduling", canManage: true },
    ],
    entities: [
      ent("visit", "Visit", ["Requested", "Confirmed", "In progress", "Completed", "No-show"], ["title", "when", "memberName", "status"], [
        { title: "GP consult", when: "Today 5pm", memberName: "Dr. Asha", status: "Confirmed" },
        { title: "Follow-up", when: "Now", memberName: "Dr. Rohan", status: "In progress" },
        { title: "Derm", when: "Mon", memberName: "Dr. Meera", status: "Completed" },
        { title: "Missed", when: "Tue", memberName: "Dr. Sam", status: "No-show" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Next visit" },
      { id: "book", title: "Book visit", type: "form", entityId: "visit", description: "Request" },
      { id: "visits", title: "My visits", type: "schedule", entityId: "visit", description: "Schedule" },
      { id: "queue", title: "Doctor queue", type: "board", entityId: "visit", roleIds: ["doctor"], description: "Consults" },
      { id: "ops", title: "Ops board", type: "board", entityId: "visit", roleIds: ["ops"], description: "Schedule" },
      { id: "settings", title: "Records", type: "settings", description: "Privacy" },
    ],
    workflows: [
      { id: "wf-book", name: "Book visit", description: "Patient books", roleId: "patient", steps: ["Book", "Confirmed"], moduleId: "book", entityId: "visit" },
      { id: "wf-doc", name: "Run consult", description: "Doctor completes", roleId: "doctor", steps: ["Queue", "Completed"], moduleId: "queue", entityId: "visit" },
      { id: "wf-ops", name: "Fix schedule", description: "Ops manages", roleId: "ops", steps: ["Ops board"], moduleId: "ops", entityId: "visit" },
    ],
  }
];

export default CATEGORIES;
