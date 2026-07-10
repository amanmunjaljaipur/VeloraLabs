/**
 * Demo app categories: productivity
 * Deploy unit: src/lib/demo-apps/groups/productivity/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
{
    slug: "team-communication",
    name: "Team Communication & Chat",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Workplace channels",
    description: "Slack-style channels, DMs, threads, admin policies.",
    examples: ["Slack", "Teams", "Google Chat"],
    productKind: "tasks",
    brandName: "Verlin Teams Chat",
    roles: [
      { id: "member", label: "Teammate", description: "Chat in channels", canCreate: true, isDefault: true },
      { id: "lead", label: "Team lead", description: "Channel owner", canCreate: true, canManage: true },
      { id: "admin", label: "Workspace admin", description: "SSO & retention", canManage: true },
    ],
    entities: [
      ent("channel", "Channel", ["Public", "Private", "Archived"], ["title", "description", "status"], [
        { title: "#product", description: "Roadmap", status: "Public" },
        { title: "#eng-secret", description: "Private", status: "Private" },
        { title: "#old-launch", description: "Archived", status: "Archived" },
        { title: "#random", description: "Watercooler", status: "Public" },
      ]),
      ent("message", "Message", ["Sent", "Pinned", "Flagged"], ["title", "description", "status"], [
        { title: "Standup notes", description: "#product", status: "Pinned" },
        { title: "Deploy window", description: "#eng-secret", status: "Sent" },
        { title: "Spam link", description: "Flagged", status: "Flagged" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Unreads" },
      { id: "channels", title: "Channels", type: "list", entityId: "channel", description: "Browse" },
      { id: "messages", title: "Messages", type: "list", entityId: "message", description: "Thread" },
      { id: "compose", title: "Compose", type: "form", entityId: "message", description: "Post" },
      { id: "new-ch", title: "New channel", type: "form", entityId: "channel", roleIds: ["lead", "admin"], description: "Create" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Policies" },
      { id: "settings", title: "Preferences", type: "settings", description: "Notifications" },
    ],
    workflows: [
      { id: "wf-msg", name: "Post update", description: "Member posts", roleId: "member", steps: ["Compose", "Sent"], moduleId: "compose", entityId: "message" },
      { id: "wf-ch", name: "Create channel", description: "Lead creates", roleId: "lead", steps: ["New channel"], moduleId: "new-ch", entityId: "channel" },
      { id: "wf-adm", name: "Set policy", description: "Admin configures", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "video-conferencing",
    name: "Video Conferencing",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Meetings & webinars",
    description: "Zoom-style meetings, schedules, hosts, recordings.",
    examples: ["Zoom", "Meet", "Teams"],
    productKind: "booking",
    brandName: "Verlin Meet",
    roles: [
      { id: "participant", label: "Participant", description: "Join meetings", canCreate: false, isDefault: true },
      { id: "host", label: "Host", description: "Schedule & run", canCreate: true, canManage: true },
      { id: "admin", label: "IT admin", description: "Recordings policy", canManage: true },
    ],
    entities: [
      ent("meeting", "Meeting", ["Scheduled", "Live", "Ended", "Cancelled"], ["title", "when", "description", "status"], [
        { title: "Weekly product", when: "Today 4pm", description: "Host You", status: "Scheduled" },
        { title: "Customer demo", when: "Now", description: "Live", status: "Live" },
        { title: "All hands", when: "Mon", description: "Ended", status: "Ended" },
        { title: "Cancelled sync", when: "Tue", description: "Cancelled", status: "Cancelled" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Upcoming" },
      { id: "meetings", title: "Meetings", type: "schedule", entityId: "meeting", description: "Calendar" },
      { id: "schedule", title: "Schedule", type: "form", entityId: "meeting", roleIds: ["host", "admin"], description: "New meeting" },
      { id: "live", title: "Live rooms", type: "board", entityId: "meeting", description: "Status" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Policies" },
      { id: "settings", title: "Settings", type: "settings", description: "AV" },
    ],
    workflows: [
      { id: "wf-join", name: "Join meeting", description: "Participant joins", roleId: "participant", steps: ["Meetings", "Join"], moduleId: "meetings", entityId: "meeting" },
      { id: "wf-host", name: "Host meeting", description: "Host schedules", roleId: "host", steps: ["Schedule", "Live", "Ended"], moduleId: "schedule", entityId: "meeting" },
      { id: "wf-adm", name: "Set recording policy", description: "IT admin", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "email-clients",
    name: "Email Clients",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Inbox management",
    description: "Gmail-style inbox, labels, compose, admin quarantine.",
    examples: ["Gmail", "Outlook", "Apple Mail"],
    productKind: "generic",
    brandName: "Verlin Mail",
    roles: [
      { id: "user", label: "User", description: "Read & send", canCreate: true, isDefault: true },
      { id: "delegate", label: "Delegate", description: "Shared inbox", canCreate: true, canManage: true },
      { id: "admin", label: "Mail admin", description: "Quarantine", canManage: true },
    ],
    entities: [
      ent("mail", "Email", ["Inbox", "Starred", "Snoozed", "Spam", "Quarantine"], ["title", "memberName", "description", "status"], [
        { title: "Q2 planning", memberName: "ceo@", description: "Thread", status: "Inbox" },
        { title: "Invoice", memberName: "billing@", description: "Starred", status: "Starred" },
        { title: "Promo", memberName: "ads@", description: "Spam", status: "Spam" },
        { title: "Suspicious", memberName: "unknown@", description: "Quarantine", status: "Quarantine" },
      ]),
    ],
    modules: [
      { id: "home", title: "Inbox", type: "dashboard", description: "Priority" },
      { id: "mail", title: "All mail", type: "board", entityId: "mail", description: "Labels" },
      { id: "compose", title: "Compose", type: "form", entityId: "mail", description: "New email" },
      { id: "admin", title: "Quarantine", type: "board", entityId: "mail", roleIds: ["admin"], description: "Security" },
      { id: "settings", title: "Settings", type: "settings", description: "Signatures" },
    ],
    workflows: [
      { id: "wf-send", name: "Send email", description: "User composes", roleId: "user", steps: ["Compose", "Inbox"], moduleId: "compose", entityId: "mail" },
      { id: "wf-del", name: "Triage shared", description: "Delegate stars", roleId: "delegate", steps: ["All mail"], moduleId: "mail", entityId: "mail" },
      { id: "wf-adm", name: "Release quarantine", description: "Admin acts", roleId: "admin", steps: ["Quarantine"], moduleId: "admin", entityId: "mail" },
    ],
  },
  {
    slug: "task-project-management",
    name: "Task & Project Management",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Boards & timelines",
    description: "Trello/Jira-style tasks, sprints, assignees, statuses.",
    examples: ["Trello", "Asana", "Jira", "Monday"],
    productKind: "tasks",
    brandName: "Verlin Flow",
    roles: [
      { id: "member", label: "Member", description: "Own tasks", canCreate: true, isDefault: true },
      { id: "pm", label: "Project manager", description: "Plan sprints", canCreate: true, canManage: true },
      { id: "admin", label: "Workspace admin", description: "Projects", canManage: true },
    ],
    entities: [
      ent("task", "Task", ["Todo", "In progress", "Blocked", "Done"], ["title", "description", "assignee", "status"], [
        { title: "Design landing", description: "Hero", assignee: "You", status: "Todo" },
        { title: "API auth", description: "Login", assignee: "Dev", status: "In progress" },
        { title: "Blocked on legal", description: "Copy", assignee: "PM", status: "Blocked" },
        { title: "Ship MVP", description: "Release", assignee: "PM", status: "Done" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "My work" },
      { id: "board", title: "Board", type: "board", entityId: "task", description: "Kanban" },
      { id: "list", title: "List", type: "list", entityId: "task", description: "All tasks" },
      { id: "new", title: "New task", type: "form", entityId: "task", description: "Create" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin", "pm"], description: "Projects" },
      { id: "settings", title: "Settings", type: "settings", description: "Notifications" },
    ],
    workflows: [
      { id: "wf-create", name: "Create task", description: "Member creates", roleId: "member", steps: ["New", "Board"], moduleId: "new", entityId: "task" },
      { id: "wf-pm", name: "Run sprint", description: "PM moves board", roleId: "pm", steps: ["Board", "Done"], moduleId: "board", entityId: "task" },
      { id: "wf-adm", name: "Configure workspace", description: "Admin settings", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "wikis-notes",
    name: "Collaborative Wikis & Note-Taking",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Docs & knowledge base",
    description: "Notion-style pages, databases, sharing, publish.",
    examples: ["Notion", "Obsidian", "Evernote", "OneNote"],
    productKind: "generic",
    brandName: "Verlin Notes",
    roles: [
      { id: "author", label: "Author", description: "Write pages", canCreate: true, isDefault: true },
      { id: "editor", label: "Editor", description: "Review & publish", canManage: true, canCreate: true },
      { id: "admin", label: "Workspace admin", description: "Permissions", canManage: true },
    ],
    entities: [
      ent("page", "Page", ["Draft", "In review", "Published", "Archived"], ["title", "description", "status"], [
        { title: "Onboarding guide", description: "HR", status: "Published" },
        { title: "API design", description: "Eng", status: "In review" },
        { title: "Personal notes", description: "Private", status: "Draft" },
        { title: "Old RFC", description: "Archive", status: "Archived" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Recent" },
      { id: "pages", title: "Pages", type: "board", entityId: "page", description: "All docs" },
      { id: "new", title: "New page", type: "form", entityId: "page", description: "Write" },
      { id: "review", title: "Review", type: "board", entityId: "page", roleIds: ["editor", "admin"], description: "Publish queue" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Access" },
      { id: "settings", title: "Settings", type: "settings", description: "Editor" },
    ],
    workflows: [
      { id: "wf-write", name: "Write page", description: "Author drafts", roleId: "author", steps: ["New", "Draft"], moduleId: "new", entityId: "page" },
      { id: "wf-pub", name: "Publish", description: "Editor publishes", roleId: "editor", steps: ["Review", "Published"], moduleId: "review", entityId: "page" },
      { id: "wf-adm", name: "Permissions", description: "Admin configures", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "generative-ai-assistants",
    name: "Generative AI Chatbots & Assistants",
    group: "productivity",
    groupLabel: G.productivity,
    tagline: "Conversational AI",
    description: "ChatGPT-style chats, prompts, agent tools, usage limits.",
    examples: ["ChatGPT", "Gemini", "Claude", "Copilot"],
    productKind: "generic",
    brandName: "Verlin AI",
    roles: [
      { id: "user", label: "User", description: "Chat with AI", canCreate: true, isDefault: true },
      { id: "builder", label: "Agent builder", description: "Custom agents", canCreate: true, canManage: true },
      { id: "admin", label: "Org admin", description: "Usage & policies", canManage: true },
    ],
    entities: [
      ent("thread", "Chat thread", ["Active", "Archived", "Shared"], ["title", "description", "status"], [
        { title: "Rewrite resume", description: "Career", status: "Active" },
        { title: "SQL help", description: "Code", status: "Active" },
        { title: "Brainstorm Q2", description: "Shared team", status: "Shared" },
        { title: "Old chat", description: "Archive", status: "Archived" },
      ]),
      ent("agent", "Agent", ["Live", "Draft", "Disabled"], ["title", "description", "status"], [
        { title: "Support copilot", description: "Docs RAG", status: "Live" },
        { title: "SQL tutor", description: "Draft", status: "Draft" },
        { title: "Old bot", description: "Disabled", status: "Disabled" },
      ]),
    ],
    modules: [
      { id: "home", title: "Chat", type: "dashboard", description: "New chat" },
      { id: "threads", title: "History", type: "list", entityId: "thread", description: "Threads" },
      { id: "new", title: "New chat", type: "form", entityId: "thread", description: "Prompt" },
      { id: "agents", title: "Agents", type: "board", entityId: "agent", roleIds: ["builder", "admin"], description: "Custom GPTs" },
      { id: "build", title: "Build agent", type: "form", entityId: "agent", roleIds: ["builder"], description: "Create" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Usage caps" },
      { id: "settings", title: "Settings", type: "settings", description: "Model prefs" },
    ],
    workflows: [
      { id: "wf-chat", name: "Ask AI", description: "User chats", roleId: "user", steps: ["New chat", "Active"], moduleId: "new", entityId: "thread" },
      { id: "wf-build", name: "Ship agent", description: "Builder goes live", roleId: "builder", steps: ["Build", "Live"], moduleId: "build", entityId: "agent" },
      { id: "wf-adm", name: "Set policy", description: "Admin caps usage", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  }
];

export default CATEGORIES;
