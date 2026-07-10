/**
 * 50 mobile/product app categories — one interactive demo each.
 * Grouped by domain for the /demo-apps gallery.
 */

export type DemoGroupId =
  | "social"
  | "entertainment"
  | "fintech"
  | "ecommerce"
  | "utilities"
  | "productivity"
  | "education"
  | "health"
  | "travel";

export type DemoCategoryDef = {
  slug: string;
  name: string;
  group: DemoGroupId;
  groupLabel: string;
  tagline: string;
  description: string;
  examples: string[];
  /** productKind for specialized UIs when applicable */
  productKind: "banking" | "resume" | "booking" | "expense" | "crm" | "tasks" | "generic";
  brandName: string;
  /** Domain roles (id, label, description, canCreate, canManage, isDefault?) */
  roles: Array<{
    id: string;
    label: string;
    description: string;
    canCreate?: boolean;
    canManage?: boolean;
    isDefault?: boolean;
  }>;
  /** Primary entities for seed + workflows */
  entities: Array<{
    id: string;
    name: string;
    namePlural: string;
    statuses: string[];
    fields: Array<{
      key: string;
      label: string;
      type: "text" | "textarea" | "number" | "select" | "status" | "email" | "phone" | "date";
      options?: string[];
      required?: boolean;
    }>;
    seeds: Array<Record<string, unknown>>;
  }>;
  /** Named modules shown as nav + screens */
  modules: Array<{
    id: string;
    title: string;
    type: "dashboard" | "list" | "form" | "board" | "schedule" | "settings" | "workspace" | "transfer";
    entityId?: string;
    roleIds?: string[];
    description: string;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    roleId: string;
    steps: string[];
    moduleId: string;
    entityId?: string;
  }>;
};

const G = {
  social: "1. Social & Communication",
  entertainment: "2. Entertainment, Media & Streaming",
  fintech: "3. Fintech, Digital Banking & Finance",
  ecommerce: "4. E-Commerce & Retail Services",
  utilities: "5. Utilities, Systems & Security",
  productivity: "6. Productivity & Workplace",
  education: "7. Education & Self-Improvement",
  health: "8. Health, Fitness & Lifestyle",
  travel: "9. Travel, Transport & Local",
} as const;

function ent(
  id: string,
  name: string,
  statuses: string[],
  fieldKeys: string[],
  seeds: Array<Record<string, unknown>>
): DemoCategoryDef["entities"][0] {
  const fields: DemoCategoryDef["entities"][0]["fields"] = fieldKeys.map((k) => {
    if (k === "status") return { key: "status", label: "Status", type: "status" as const };
    if (k === "amount" || k === "price" || k === "calories" || k === "score" || k === "qty")
      return { key: k, label: k[0].toUpperCase() + k.slice(1), type: "number" as const };
    if (k === "description" || k === "notes" || k === "body" || k === "summary")
      return { key: k, label: k[0].toUpperCase() + k.slice(1), type: "textarea" as const };
    if (k === "email") return { key: "email", label: "Email", type: "email" as const };
    if (k === "phone") return { key: "phone", label: "Phone", type: "phone" as const };
    return {
      key: k,
      label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      type: "text" as const,
      required: k === "title" || k === "name",
    };
  });
  return {
    id,
    name,
    namePlural: name.endsWith("s") ? name : `${name}s`,
    statuses,
    fields,
    seeds: seeds.map((s) => ({ ...s })),
  };
}

/** All 50 categories — exhaustive product demos */
export const DEMO_CATEGORIES: DemoCategoryDef[] = [
  // —— 1. Social ——
  {
    slug: "instant-messaging",
    name: "Instant Messaging & Chat",
    group: "social",
    groupLabel: G.social,
    tagline: "Direct, real-time text & media",
    description:
      "WhatsApp-style messaging: 1:1 and group chats, media share, read receipts, mute, block.",
    examples: ["WhatsApp", "Telegram", "Signal", "WeChat"],
    productKind: "generic",
    brandName: "Verlin Chat",
    roles: [
      { id: "user", label: "Member", description: "Send messages, create groups", canCreate: true, isDefault: true },
      { id: "moderator", label: "Group admin", description: "Manage group members & settings", canCreate: true, canManage: true },
      { id: "support", label: "Safety support", description: "Handle reports and blocks", canManage: true },
    ],
    entities: [
      ent("chat", "Chat", ["Active", "Muted", "Archived"], ["title", "memberName", "description", "status"], [
        { title: "Priya S.", memberName: "You", description: "Last: See you at 6", status: "Active" },
        { title: "Product team", memberName: "8 members", description: "Last: Ship notes", status: "Active" },
        { title: "Family", memberName: "5 members", description: "Muted", status: "Muted" },
        { title: "Old college", memberName: "12 members", description: "Archived", status: "Archived" },
      ]),
      ent("message", "Message", ["Sent", "Delivered", "Read", "Failed"], ["title", "description", "status"], [
        { title: "Hey!", description: "Are we still on?", status: "Read" },
        { title: "Photo", description: "Shared image", status: "Delivered" },
        { title: "Voice note", description: "0:12", status: "Sent" },
        { title: "Link", description: "docs.verlinlabs.com", status: "Failed" },
      ]),
      ent("report", "Report", ["Open", "Reviewing", "Closed"], ["title", "description", "status"], [
        { title: "Spam group invite", description: "Unknown number", status: "Open" },
        { title: "Harassment", description: "DM thread", status: "Reviewing" },
      ]),
    ],
    modules: [
      { id: "home", title: "Chats", type: "dashboard", description: "Inbox overview" },
      { id: "inbox", title: "All chats", type: "list", entityId: "chat", description: "Chat list" },
      { id: "new-chat", title: "New chat", type: "form", entityId: "chat", description: "Start conversation" },
      { id: "messages", title: "Messages", type: "list", entityId: "message", description: "Thread messages" },
      { id: "compose", title: "Compose", type: "form", entityId: "message", description: "Send message" },
      { id: "reports", title: "Safety", type: "board", entityId: "report", roleIds: ["support", "moderator"], description: "Reports queue" },
      { id: "settings", title: "Settings", type: "settings", description: "Privacy & notifications" },
    ],
    workflows: [
      { id: "wf-msg", name: "Send a message", description: "Open chat → compose → sent/delivered", roleId: "user", steps: ["Open chats", "Select thread", "Compose", "Send", "See status"], moduleId: "compose", entityId: "message" },
      { id: "wf-group", name: "Manage group", description: "Admin mutes/archives group", roleId: "moderator", steps: ["Open chat", "Change status", "Notify members"], moduleId: "inbox", entityId: "chat" },
      { id: "wf-safe", name: "Resolve report", description: "Support closes safety case", roleId: "support", steps: ["Open Safety", "Review", "Close"], moduleId: "reports", entityId: "report" },
    ],
  },
  {
    slug: "social-networking",
    name: "Social Networking",
    group: "social",
    groupLabel: G.social,
    tagline: "Friends, updates, networks",
    description: "Facebook/Instagram-style feed, posts, follows, comments moderation.",
    examples: ["Facebook", "Instagram", "Threads"],
    productKind: "generic",
    brandName: "Verlin Social",
    roles: [
      { id: "member", label: "Member", description: "Post and engage", canCreate: true, isDefault: true },
      { id: "creator", label: "Creator", description: "Publish content series", canCreate: true, canManage: true },
      { id: "moderator", label: "Moderator", description: "Moderate posts", canManage: true },
    ],
    entities: [
      ent("post", "Post", ["Draft", "Published", "Hidden", "Removed"], ["title", "description", "memberName", "status"], [
        { title: "Weekend hike", description: "Nilgiris 🔥", memberName: "Asha", status: "Published" },
        { title: "Product launch", description: "v2 is live", memberName: "You", status: "Draft" },
        { title: "Spam offer", description: "Click here", memberName: "Unknown", status: "Hidden" },
        { title: "Team photo", description: "Offsite", memberName: "Rohan", status: "Published" },
      ]),
      ent("follow", "Follow", ["Active", "Muted", "Blocked"], ["title", "memberName", "status"], [
        { title: "@asha", memberName: "Asha K.", status: "Active" },
        { title: "@verlin", memberName: "Verlin Labs", status: "Active" },
        { title: "@noise", memberName: "Spam", status: "Blocked" },
      ]),
    ],
    modules: [
      { id: "feed", title: "Feed", type: "dashboard", description: "Home feed" },
      { id: "posts", title: "Posts", type: "board", entityId: "post", description: "Post pipeline" },
      { id: "create", title: "Create post", type: "form", entityId: "post", description: "New post" },
      { id: "network", title: "Network", type: "list", entityId: "follow", description: "Following" },
      { id: "mod", title: "Moderation", type: "board", entityId: "post", roleIds: ["moderator"], description: "Hide/remove" },
      { id: "settings", title: "Settings", type: "settings", description: "Privacy" },
    ],
    workflows: [
      { id: "wf-post", name: "Publish post", description: "Draft → Published", roleId: "member", steps: ["Create", "Preview", "Publish"], moduleId: "create", entityId: "post" },
      { id: "wf-create", name: "Creator series", description: "Creator publishes content", roleId: "creator", steps: ["Create", "Publish", "Track"], moduleId: "posts", entityId: "post" },
      { id: "wf-mod", name: "Moderate content", description: "Hide spam", roleId: "moderator", steps: ["Open mod", "Hide/Remove"], moduleId: "mod", entityId: "post" },
    ],
  },
  {
    slug: "professional-networking",
    name: "Professional Networking & Jobs",
    group: "social",
    groupLabel: G.social,
    tagline: "Careers, hiring, B2B",
    description: "LinkedIn-style profiles, jobs, applications, recruiter pipeline.",
    examples: ["LinkedIn", "Indeed", "Glassdoor"],
    productKind: "resume",
    brandName: "Verlin Careers",
    roles: [
      { id: "seeker", label: "Job seeker", description: "Apply and network", canCreate: true, isDefault: true },
      { id: "recruiter", label: "Recruiter", description: "Post jobs and review", canCreate: true, canManage: true },
      { id: "admin", label: "Platform admin", description: "Oversee marketplace", canManage: true },
    ],
    entities: [
      ent("job", "Job", ["Open", "Interviewing", "Filled", "Closed"], ["title", "description", "memberName", "amount", "status"], [
        { title: "Frontend Engineer", description: "React · Bengaluru", memberName: "Acme", amount: 1800000, status: "Open" },
        { title: "Product Manager", description: "B2B SaaS", memberName: "Bright Labs", amount: 2400000, status: "Interviewing" },
        { title: "Data Analyst", description: "SQL + Python", memberName: "Northwind", amount: 1200000, status: "Open" },
        { title: "Sales AE", description: "Enterprise", memberName: "Horizon", amount: 1500000, status: "Filled" },
      ]),
      ent("application", "Application", ["Applied", "Screening", "Offer", "Rejected"], ["title", "memberName", "description", "status"], [
        { title: "Frontend Engineer", memberName: "You", description: "Referral", status: "Applied" },
        { title: "PM role", memberName: "Priya", description: "Strong fit", status: "Screening" },
        { title: "Analyst", memberName: "Arjun", description: "Portfolio", status: "Offer" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Career hub" },
      { id: "jobs", title: "Jobs", type: "list", entityId: "job", description: "Browse roles" },
      { id: "apply", title: "Apply", type: "form", entityId: "application", description: "Submit application" },
      { id: "apps", title: "My applications", type: "board", entityId: "application", description: "Pipeline" },
      { id: "post-job", title: "Post job", type: "form", entityId: "job", roleIds: ["recruiter", "admin"], description: "New listing" },
      { id: "pipeline", title: "Hiring pipeline", type: "board", entityId: "application", roleIds: ["recruiter", "admin"], description: "Candidates" },
      { id: "settings", title: "Settings", type: "settings", description: "Profile visibility" },
    ],
    workflows: [
      { id: "wf-apply", name: "Apply to job", description: "Seeker applies", roleId: "seeker", steps: ["Browse", "Apply", "Track"], moduleId: "apply", entityId: "application" },
      { id: "wf-hire", name: "Hire pipeline", description: "Recruiter advances candidates", roleId: "recruiter", steps: ["Post job", "Review apps", "Offer"], moduleId: "pipeline", entityId: "application" },
      { id: "wf-admin", name: "Oversee market", description: "Admin monitors jobs", roleId: "admin", steps: ["Jobs", "Close spam"], moduleId: "jobs", entityId: "job" },
    ],
  },
  {
    slug: "short-form-video",
    name: "Short-Form Video Platforms",
    group: "social",
    groupLabel: G.social,
    tagline: "Vertical video discovery",
    description: "TikTok-style short videos, creator studio, moderation, trends.",
    examples: ["TikTok", "Reels", "Shorts"],
    productKind: "generic",
    brandName: "Verlin Clips",
    roles: [
      { id: "viewer", label: "Viewer", description: "Watch and engage", canCreate: false, isDefault: true },
      { id: "creator", label: "Creator", description: "Upload shorts", canCreate: true, canManage: true },
      { id: "moderator", label: "Trust & safety", description: "Moderate clips", canManage: true },
    ],
    entities: [
      ent("clip", "Clip", ["Processing", "Live", "Flagged", "Removed"], ["title", "memberName", "description", "amount", "status"], [
        { title: "60s recipe", memberName: "Chef Meera", description: "Food", amount: 120000, status: "Live" },
        { title: "Code tip", memberName: "You", description: "Dev", amount: 8000, status: "Processing" },
        { title: "Dance trend", memberName: "Riya", description: "Trend", amount: 500000, status: "Live" },
        { title: "Spam clip", memberName: "Bot", description: "Flagged", amount: 10, status: "Flagged" },
      ]),
    ],
    modules: [
      { id: "for-you", title: "For You", type: "dashboard", description: "Feed" },
      { id: "clips", title: "Clips", type: "board", entityId: "clip", description: "Library" },
      { id: "upload", title: "Upload", type: "form", entityId: "clip", roleIds: ["creator"], description: "New clip" },
      { id: "safety", title: "Safety", type: "board", entityId: "clip", roleIds: ["moderator"], description: "Flags" },
      { id: "settings", title: "Settings", type: "settings", description: "Preferences" },
    ],
    workflows: [
      { id: "wf-watch", name: "Discover clips", description: "Viewer browses For You", roleId: "viewer", steps: ["Open feed", "Engage"], moduleId: "for-you" },
      { id: "wf-upload", name: "Upload short", description: "Creator publishes", roleId: "creator", steps: ["Upload", "Process", "Live"], moduleId: "upload", entityId: "clip" },
      { id: "wf-mod", name: "Moderate clip", description: "Remove policy violations", roleId: "moderator", steps: ["Safety", "Remove"], moduleId: "safety", entityId: "clip" },
    ],
  },
  {
    slug: "dating-matchmaking",
    name: "Dating & Matchmaking",
    group: "social",
    groupLabel: G.social,
    tagline: "Discovery & relationships",
    description: "Tinder-style profiles, matches, chats, safety reports.",
    examples: ["Tinder", "Bumble", "Hinge"],
    productKind: "generic",
    brandName: "Verlin Connect",
    roles: [
      { id: "member", label: "Member", description: "Swipe and match", canCreate: true, isDefault: true },
      { id: "premium", label: "Premium member", description: "Boosts & filters", canCreate: true, canManage: true },
      { id: "safety", label: "Safety agent", description: "Reports", canManage: true },
    ],
    entities: [
      ent("match", "Match", ["New", "Chatting", "Paused", "Unmatched"], ["title", "memberName", "description", "status"], [
        { title: "Asha · 28", memberName: "2 km", description: "Coffee?", status: "Chatting" },
        { title: "Rohan · 31", memberName: "5 km", description: "New match", status: "New" },
        { title: "Meera · 26", memberName: "3 km", description: "Paused", status: "Paused" },
        { title: "Sam · 29", memberName: "8 km", description: "Unmatched", status: "Unmatched" },
      ]),
      ent("report", "Safety report", ["Open", "Actioned", "Dismissed"], ["title", "description", "status"], [
        { title: "Fake profile", description: "Photo mismatch", status: "Open" },
        { title: "Harassment DM", description: "User reported", status: "Actioned" },
        { title: "Spam bot", description: "Dismissed", status: "Dismissed" },
      ]),
    ],
    modules: [
      { id: "discover", title: "Discover", type: "dashboard", description: "Cards" },
      { id: "matches", title: "Matches", type: "list", entityId: "match", description: "Your matches" },
      { id: "profile", title: "Edit profile", type: "form", entityId: "match", description: "Profile" },
      { id: "safety", title: "Safety", type: "board", entityId: "report", roleIds: ["safety"], description: "Reports" },
      { id: "settings", title: "Settings", type: "settings", description: "Filters" },
    ],
    workflows: [
      { id: "wf-match", name: "Match & chat", description: "Member matches", roleId: "member", steps: ["Discover", "Match", "Chat"], moduleId: "matches", entityId: "match" },
      { id: "wf-boost", name: "Premium boost", description: "Premium filters", roleId: "premium", steps: ["Settings", "Boost"], moduleId: "settings" },
      { id: "wf-safe", name: "Safety action", description: "Agent handles report", roleId: "safety", steps: ["Open report", "Action"], moduleId: "safety", entityId: "report" },
    ],
  },
  {
    slug: "community-forums",
    name: "Community Forums & Interest Groups",
    group: "social",
    groupLabel: G.social,
    tagline: "Discussions & communities",
    description: "Reddit/Discord-style communities, posts, moderation queues.",
    examples: ["Reddit", "Discord", "Quora"],
    productKind: "generic",
    brandName: "Verlin Circles",
    roles: [
      { id: "member", label: "Member", description: "Post and comment", canCreate: true, isDefault: true },
      { id: "moderator", label: "Moderator", description: "Community rules", canManage: true, canCreate: true },
      { id: "admin", label: "Platform admin", description: "All communities", canManage: true },
    ],
    entities: [
      ent("thread", "Thread", ["Open", "Hot", "Locked", "Removed"], ["title", "description", "memberName", "status"], [
        { title: "Best mental models?", description: "r/learning", memberName: "You", status: "Hot" },
        { title: "AI tools 2026", description: "r/product", memberName: "Priya", status: "Open" },
        { title: "Spam thread", description: "r/random", memberName: "Bot", status: "Removed" },
        { title: "AMA Friday", description: "r/verlin", memberName: "Mod", status: "Locked" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Feed" },
      { id: "threads", title: "Threads", type: "board", entityId: "thread", description: "Discussions" },
      { id: "new", title: "New thread", type: "form", entityId: "thread", description: "Post" },
      { id: "mod", title: "Mod queue", type: "board", entityId: "thread", roleIds: ["moderator", "admin"], description: "Moderate" },
      { id: "settings", title: "Settings", type: "settings", description: "Community prefs" },
    ],
    workflows: [
      { id: "wf-post", name: "Start discussion", description: "Member posts", roleId: "member", steps: ["New thread", "Publish"], moduleId: "new", entityId: "thread" },
      { id: "wf-mod", name: "Moderate", description: "Lock/remove", roleId: "moderator", steps: ["Mod queue", "Action"], moduleId: "mod", entityId: "thread" },
      { id: "wf-admin", name: "Platform oversight", description: "Admin reviews", roleId: "admin", steps: ["Mod queue"], moduleId: "mod", entityId: "thread" },
    ],
  },
  // —— 2. Entertainment ——
  {
    slug: "svod-streaming",
    name: "Video-on-Demand (SVOD)",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Movies, series, live TV",
    description: "Netflix-style catalog, watchlist, profiles, billing support.",
    examples: ["Netflix", "Disney+", "Prime Video"],
    productKind: "generic",
    brandName: "Verlin Stream",
    roles: [
      { id: "viewer", label: "Viewer", description: "Watch content", canCreate: true, isDefault: true },
      { id: "family", label: "Family manager", description: "Profiles & PIN", canCreate: true, canManage: true },
      { id: "support", label: "Support", description: "Playback issues", canManage: true },
    ],
    entities: [
      ent("title", "Title", ["Available", "Coming soon", "Leaving", "Geo-blocked"], ["title", "description", "level", "status"], [
        { title: "Night City", description: "Thriller · 8.2", level: "Series", status: "Available" },
        { title: "Ocean Docs", description: "Documentary", level: "Film", status: "Available" },
        { title: "Season finale", description: "Next week", level: "Series", status: "Coming soon" },
        { title: "Classic hits", description: "Leaving soon", level: "Film", status: "Leaving" },
      ]),
      ent("watchlist", "Watchlist item", ["Queued", "Watching", "Done"], ["title", "status"], [
        { title: "Night City S1", status: "Watching" },
        { title: "Ocean Docs", status: "Queued" },
        { title: "Comedy special", status: "Done" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Continue watching" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "title", description: "Browse" },
      { id: "watchlist", title: "My list", type: "board", entityId: "watchlist", description: "Queue" },
      { id: "add", title: "Add to list", type: "form", entityId: "watchlist", description: "Save title" },
      { id: "support", title: "Help", type: "list", entityId: "title", roleIds: ["support"], description: "Issues" },
      { id: "settings", title: "Profiles", type: "settings", description: "Family profiles" },
    ],
    workflows: [
      { id: "wf-watch", name: "Watch & queue", description: "Viewer continues", roleId: "viewer", steps: ["Home", "Play", "List"], moduleId: "watchlist", entityId: "watchlist" },
      { id: "wf-family", name: "Manage profiles", description: "Family PIN", roleId: "family", steps: ["Settings", "Profiles"], moduleId: "settings" },
      { id: "wf-sup", name: "Support playback", description: "Help ticket", roleId: "support", steps: ["Help", "Resolve"], moduleId: "support" },
    ],
  },
  {
    slug: "ugc-video",
    name: "User-Generated Video Platforms",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Creators, vlogs, tutorials",
    description: "YouTube-style channels, uploads, monetization flags, studio.",
    examples: ["YouTube", "Vimeo", "DailyMotion"],
    productKind: "generic",
    brandName: "Verlin Tube",
    roles: [
      { id: "viewer", label: "Viewer", description: "Watch & subscribe", canCreate: false, isDefault: true },
      { id: "creator", label: "Creator", description: "Upload & analytics", canCreate: true, canManage: true },
      { id: "moderator", label: "Moderator", description: "Copyright & abuse", canManage: true },
    ],
    entities: [
      ent("video", "Video", ["Processing", "Public", "Unlisted", "Removed"], ["title", "memberName", "description", "amount", "status"], [
        { title: "Build in public #12", memberName: "You", description: "Tutorial", amount: 14000, status: "Public" },
        { title: "Interview clip", memberName: "Studio", description: "Talk", amount: 90000, status: "Public" },
        { title: "Raw upload", memberName: "You", description: "Processing", amount: 0, status: "Processing" },
        { title: "Strike video", memberName: "Other", description: "Claim", amount: 200, status: "Removed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Recommended" },
      { id: "library", title: "Library", type: "list", entityId: "video", description: "Videos" },
      { id: "studio", title: "Studio", type: "board", entityId: "video", roleIds: ["creator"], description: "Creator studio" },
      { id: "upload", title: "Upload", type: "form", entityId: "video", roleIds: ["creator"], description: "New video" },
      { id: "mod", title: "Moderation", type: "board", entityId: "video", roleIds: ["moderator"], description: "Claims" },
      { id: "settings", title: "Settings", type: "settings", description: "Channel" },
    ],
    workflows: [
      { id: "wf-watch", name: "Watch library", description: "Viewer browses", roleId: "viewer", steps: ["Home", "Watch"], moduleId: "library", entityId: "video" },
      { id: "wf-up", name: "Upload video", description: "Creator publishes", roleId: "creator", steps: ["Upload", "Process", "Public"], moduleId: "upload", entityId: "video" },
      { id: "wf-mod", name: "Handle claim", description: "Moderator acts", roleId: "moderator", steps: ["Mod", "Remove/restore"], moduleId: "mod", entityId: "video" },
    ],
  },
  {
    slug: "music-podcasts",
    name: "Music & Podcast Streaming",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Music, playlists, podcasts",
    description: "Spotify-style library, playlists, podcasts, offline queue.",
    examples: ["Spotify", "Apple Music", "YouTube Music"],
    productKind: "generic",
    brandName: "Verlin Audio",
    roles: [
      { id: "listener", label: "Listener", description: "Play & save", canCreate: true, isDefault: true },
      { id: "artist", label: "Artist / host", description: "Release tracks", canCreate: true, canManage: true },
      { id: "ops", label: "Catalog ops", description: "Rights & takedowns", canManage: true },
    ],
    entities: [
      ent("track", "Track", ["Live", "Exclusive", "Pending", "Takedown"], ["title", "memberName", "description", "status"], [
        { title: "Morning Lo-fi", memberName: "DJ Asha", description: "Playlist seed", status: "Live" },
        { title: "AI PM Podcast #4", memberName: "Verlin", description: "Episode", status: "Live" },
        { title: "Unreleased", memberName: "You", description: "Pending review", status: "Pending" },
        { title: "Claimed track", memberName: "Other", description: "Dispute", status: "Takedown" },
      ]),
      ent("playlist", "Playlist", ["Public", "Private", "Collaborative"], ["title", "description", "status"], [
        { title: "Focus deep work", description: "32 songs", status: "Private" },
        { title: "Commute energy", description: "Shared", status: "Collaborative" },
        { title: "Weekly discovery", description: "Public", status: "Public" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Listen now" },
      { id: "tracks", title: "Tracks", type: "list", entityId: "track", description: "Catalog" },
      { id: "playlists", title: "Playlists", type: "board", entityId: "playlist", description: "Your lists" },
      { id: "new-pl", title: "New playlist", type: "form", entityId: "playlist", description: "Create list" },
      { id: "release", title: "Release", type: "form", entityId: "track", roleIds: ["artist"], description: "Upload" },
      { id: "ops", title: "Catalog ops", type: "board", entityId: "track", roleIds: ["ops"], description: "Takedowns" },
      { id: "settings", title: "Settings", type: "settings", description: "Audio quality" },
    ],
    workflows: [
      { id: "wf-listen", name: "Build playlist", description: "Listener saves", roleId: "listener", steps: ["Tracks", "Playlist"], moduleId: "new-pl", entityId: "playlist" },
      { id: "wf-rel", name: "Release track", description: "Artist uploads", roleId: "artist", steps: ["Release", "Live"], moduleId: "release", entityId: "track" },
      { id: "wf-ops", name: "Takedown", description: "Ops enforces rights", roleId: "ops", steps: ["Ops board", "Takedown"], moduleId: "ops", entityId: "track" },
    ],
  },
  {
    slug: "audiobooks",
    name: "Audiobooks & Voice Entertainment",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Narrated books & stories",
    description: "Audible-style library, progress, credits, narrator catalog.",
    examples: ["Audible", "Storytel", "Libby"],
    productKind: "generic",
    brandName: "Verlin Listen",
    roles: [
      { id: "reader", label: "Listener", description: "Play audiobooks", canCreate: true, isDefault: true },
      { id: "publisher", label: "Publisher", description: "Add titles", canCreate: true, canManage: true },
      { id: "support", label: "Support", description: "Refunds & sync", canManage: true },
    ],
    entities: [
      ent("book", "Audiobook", ["Available", "Finished", "Wishlist", "Credit used"], ["title", "memberName", "description", "status"], [
        { title: "Atomic Habits", memberName: "Narrator A", description: "Self-help", status: "Available" },
        { title: "The Almanack", memberName: "Narrator B", description: "Business", status: "Finished" },
        { title: "New release", memberName: "Narrator C", description: "Wishlist", status: "Wishlist" },
        { title: "Sci-fi epic", memberName: "Narrator D", description: "Credit", status: "Credit used" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Continue" },
      { id: "library", title: "Library", type: "board", entityId: "book", description: "Your books" },
      { id: "browse", title: "Browse", type: "list", entityId: "book", description: "Catalog" },
      { id: "add", title: "Add title", type: "form", entityId: "book", roleIds: ["publisher"], description: "Publish" },
      { id: "support", title: "Support", type: "list", entityId: "book", roleIds: ["support"], description: "Cases" },
      { id: "settings", title: "Settings", type: "settings", description: "Playback speed" },
    ],
    workflows: [
      { id: "wf-play", name: "Listen & finish", description: "Reader completes book", roleId: "reader", steps: ["Library", "Play", "Finished"], moduleId: "library", entityId: "book" },
      { id: "wf-pub", name: "Publish title", description: "Publisher adds book", roleId: "publisher", steps: ["Add", "Available"], moduleId: "add", entityId: "book" },
      { id: "wf-sup", name: "Support sync", description: "Fix progress", roleId: "support", steps: ["Support", "Resolve"], moduleId: "support" },
    ],
  },
  {
    slug: "creative-editors",
    name: "Creative Video & Photo Editors",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Edit photos & videos",
    description: "CapCut/Canva-style projects, templates, export jobs.",
    examples: ["CapCut", "Canva", "VSCO", "Lightroom"],
    productKind: "generic",
    brandName: "Verlin Studio Edit",
    roles: [
      { id: "creator", label: "Creator", description: "Edit projects", canCreate: true, isDefault: true },
      { id: "collaborator", label: "Collaborator", description: "Comment & co-edit", canCreate: true },
      { id: "admin", label: "Brand admin", description: "Templates & brand kit", canManage: true, canCreate: true },
    ],
    entities: [
      ent("project", "Project", ["Draft", "In review", "Exported", "Failed"], ["title", "description", "status"], [
        { title: "Reel draft", description: "15s cut", status: "Draft" },
        { title: "Launch carousel", description: "5 slides", status: "In review" },
        { title: "Thumbnail set", description: "PNG", status: "Exported" },
        { title: "4K export", description: "Render error", status: "Failed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Projects", type: "dashboard", description: "Recent" },
      { id: "board", title: "All projects", type: "board", entityId: "project", description: "Status board" },
      { id: "new", title: "New project", type: "form", entityId: "project", description: "Start edit" },
      { id: "templates", title: "Templates", type: "list", entityId: "project", roleIds: ["admin"], description: "Brand kit" },
      { id: "settings", title: "Settings", type: "settings", description: "Export defaults" },
    ],
    workflows: [
      { id: "wf-edit", name: "Edit & export", description: "Creator exports", roleId: "creator", steps: ["New", "Edit", "Export"], moduleId: "new", entityId: "project" },
      { id: "wf-collab", name: "Review draft", description: "Collaborator reviews", roleId: "collaborator", steps: ["Board", "In review"], moduleId: "board", entityId: "project" },
      { id: "wf-admin", name: "Brand templates", description: "Admin manages kit", roleId: "admin", steps: ["Templates"], moduleId: "templates" },
    ],
  },
  {
    slug: "digital-reading",
    name: "Digital Reading & E-books",
    group: "entertainment",
    groupLabel: G.entertainment,
    tagline: "Novels, webcomics, articles",
    description: "Kindle/Wattpad-style library, reading progress, author uploads.",
    examples: ["Kindle", "Wattpad", "Webtoon"],
    productKind: "generic",
    brandName: "Verlin Reads",
    roles: [
      { id: "reader", label: "Reader", description: "Read & bookmark", canCreate: true, isDefault: true },
      { id: "author", label: "Author", description: "Publish chapters", canCreate: true, canManage: true },
      { id: "editor", label: "Editor", description: "Review submissions", canManage: true },
    ],
    entities: [
      ent("book", "Book", ["Reading", "Finished", "Wishlist", "Submitted"], ["title", "memberName", "description", "status"], [
        { title: "Indie sci-fi", memberName: "Author A", description: "Ch 12", status: "Reading" },
        { title: "Webcomic arc", memberName: "Artist B", description: "Ep 40", status: "Finished" },
        { title: "New novel", memberName: "You", description: "Wishlist", status: "Wishlist" },
        { title: "Draft chapter", memberName: "You", description: "Awaiting edit", status: "Submitted" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Continue reading" },
      { id: "shelf", title: "Shelf", type: "board", entityId: "book", description: "Library" },
      { id: "browse", title: "Browse", type: "list", entityId: "book", description: "Discover" },
      { id: "write", title: "Write", type: "form", entityId: "book", roleIds: ["author"], description: "Publish" },
      { id: "review", title: "Editorial", type: "board", entityId: "book", roleIds: ["editor"], description: "Submissions" },
      { id: "settings", title: "Settings", type: "settings", description: "Reader theme" },
    ],
    workflows: [
      { id: "wf-read", name: "Read book", description: "Reader finishes", roleId: "reader", steps: ["Shelf", "Read", "Finished"], moduleId: "shelf", entityId: "book" },
      { id: "wf-write", name: "Publish chapter", description: "Author submits", roleId: "author", steps: ["Write", "Submit"], moduleId: "write", entityId: "book" },
      { id: "wf-edit", name: "Editorial review", description: "Editor approves", roleId: "editor", steps: ["Review", "Publish"], moduleId: "review", entityId: "book" },
    ],
  },
  // —— 3. Fintech ——
  {
    slug: "digital-banking",
    name: "Digital Banking & Neobanks",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Mobile-first accounts",
    description: "Full neobank: accounts, send money, UPI, cards, bills, KYC, ops.",
    examples: ["Revolut", "Chime", "Monzo"],
    productKind: "banking",
    brandName: "Horizon Bank",
    roles: [
      { id: "customer", label: "Customer", description: "Bank daily", canCreate: true, canManage: true, isDefault: true },
      { id: "support", label: "Support agent", description: "Cases", canManage: true, canCreate: true },
      { id: "ops", label: "Bank ops", description: "Risk queue", canManage: true, canCreate: true },
    ],
    entities: [
      ent("account", "Account", ["Active", "Frozen", "Closed"], ["title", "amount", "level", "status"], [
        { title: "Everyday Savings", amount: 84250, level: "Savings", status: "Active" },
        { title: "Salary Current", amount: 126400, level: "Current", status: "Active" },
        { title: "UPI Wallet", amount: 2340, level: "Wallet", status: "Active" },
        { title: "Emergency Fund", amount: 50000, level: "Savings", status: "Frozen" },
      ]),
      ent("transfer", "Transfer", ["Pending", "2FA", "Completed", "Failed"], ["title", "amount", "description", "status"], [
        { title: "Asha Sharma", amount: 1500, description: "Dinner", status: "Completed" },
        { title: "Rent", amount: 25000, description: "Monthly", status: "Pending" },
        { title: "Unknown UPI", amount: 9000, description: "Flagged", status: "2FA" },
        { title: "Failed IMPS", amount: 500, description: "Retry", status: "Failed" },
      ]),
      ent("card", "Card", ["Active", "Frozen", "Blocked"], ["title", "amount", "description", "status"], [
        { title: "Primary debit", amount: 50000, description: "•••• 4821", status: "Active" },
        { title: "Virtual", amount: 15000, description: "•••• 9033", status: "Active" },
        { title: "Travel", amount: 20000, description: "•••• 1102", status: "Frozen" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Balances" },
      { id: "accounts", title: "Accounts", type: "list", entityId: "account", description: "All accounts" },
      { id: "send", title: "Send money", type: "transfer", entityId: "transfer", description: "Pay" },
      { id: "cards", title: "Cards", type: "board", entityId: "card", description: "Freeze/limits" },
      { id: "transfers", title: "Transfers", type: "list", entityId: "transfer", description: "History" },
      { id: "ops", title: "Ops queue", type: "board", entityId: "transfer", roleIds: ["ops", "support"], description: "Risk" },
      { id: "settings", title: "Security", type: "settings", description: "2FA" },
    ],
    workflows: [
      { id: "wf-pay", name: "Send money", description: "Customer pays", roleId: "customer", steps: ["Send", "OTP", "Done"], moduleId: "send", entityId: "transfer" },
      { id: "wf-card", name: "Freeze card", description: "Customer freezes", roleId: "customer", steps: ["Cards", "Freeze"], moduleId: "cards", entityId: "card" },
      { id: "wf-ops", name: "Clear risk", description: "Ops approves", roleId: "ops", steps: ["Ops", "Approve"], moduleId: "ops", entityId: "transfer" },
    ],
  },
  {
    slug: "mobile-wallets",
    name: "Mobile Wallets & P2P Payments",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "P2P & tap-to-pay",
    description: "PayPal/Venmo-style wallet balance, P2P, requests, disputes.",
    examples: ["PayPal", "Venmo", "Cash App", "GPay"],
    productKind: "banking",
    brandName: "Verlin Pay",
    roles: [
      { id: "user", label: "User", description: "Send & receive", canCreate: true, canManage: true, isDefault: true },
      { id: "merchant", label: "Merchant", description: "Collect payments", canCreate: true, canManage: true },
      { id: "risk", label: "Risk analyst", description: "Fraud queue", canManage: true },
    ],
    entities: [
      ent("payment", "Payment", ["Requested", "Completed", "Declined", "Disputed"], ["title", "amount", "description", "status"], [
        { title: "Split dinner", amount: 850, description: "To Asha", status: "Completed" },
        { title: "Rent share", amount: 12000, description: "Request", status: "Requested" },
        { title: "Refund", amount: 499, description: "Merchant", status: "Declined" },
        { title: "Unknown charge", amount: 2000, description: "Dispute", status: "Disputed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Wallet", type: "dashboard", description: "Balance" },
      { id: "pay", title: "Send / request", type: "form", entityId: "payment", description: "P2P" },
      { id: "activity", title: "Activity", type: "board", entityId: "payment", description: "History" },
      { id: "merchant", title: "Merchant", type: "list", entityId: "payment", roleIds: ["merchant"], description: "Collections" },
      { id: "risk", title: "Risk", type: "board", entityId: "payment", roleIds: ["risk"], description: "Fraud" },
      { id: "settings", title: "Settings", type: "settings", description: "Linked banks" },
    ],
    workflows: [
      { id: "wf-p2p", name: "Send P2P", description: "User pays friend", roleId: "user", steps: ["Pay", "Confirm", "Done"], moduleId: "pay", entityId: "payment" },
      { id: "wf-merch", name: "Collect payment", description: "Merchant tracks", roleId: "merchant", steps: ["Merchant", "Complete"], moduleId: "merchant", entityId: "payment" },
      { id: "wf-risk", name: "Fraud review", description: "Risk disputes", roleId: "risk", steps: ["Risk", "Action"], moduleId: "risk", entityId: "payment" },
    ],
  },
  {
    slug: "retail-banking",
    name: "Traditional Retail Banking",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Branch bank mobile portal",
    description: "Chase-style accounts, statements, cheques, branch appointments.",
    examples: ["Chase", "Bank of America", "HSBC"],
    productKind: "banking",
    brandName: "Verlin National Bank",
    roles: [
      { id: "customer", label: "Customer", description: "Everyday banking", canCreate: true, isDefault: true },
      { id: "teller", label: "Branch staff", description: "Appointments", canManage: true, canCreate: true },
      { id: "rm", label: "Relationship manager", description: "Priority clients", canManage: true },
    ],
    entities: [
      ent("account", "Account", ["Active", "Dormant", "Closed"], ["title", "amount", "status"], [
        { title: "Checking ****1200", amount: 45200, status: "Active" },
        { title: "Savings ****8841", amount: 210000, status: "Active" },
        { title: "Old joint", amount: 0, status: "Dormant" },
      ]),
      ent("appointment", "Branch visit", ["Booked", "Completed", "No-show", "Cancelled"], ["title", "when", "status"], [
        { title: "Loan consult", when: "Fri 11:00", status: "Booked" },
        { title: "Card pickup", when: "Mon 15:00", status: "Completed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Overview" },
      { id: "accounts", title: "Accounts", type: "list", entityId: "account", description: "Balances" },
      { id: "book", title: "Book branch", type: "form", entityId: "appointment", description: "Visit" },
      { id: "visits", title: "Appointments", type: "schedule", entityId: "appointment", description: "Schedule" },
      { id: "staff", title: "Branch queue", type: "board", entityId: "appointment", roleIds: ["teller", "rm"], description: "Staff" },
      { id: "settings", title: "Settings", type: "settings", description: "Alerts" },
    ],
    workflows: [
      { id: "wf-acc", name: "View accounts", description: "Customer checks balances", roleId: "customer", steps: ["Home", "Accounts"], moduleId: "accounts", entityId: "account" },
      { id: "wf-book", name: "Book branch visit", description: "Customer books", roleId: "customer", steps: ["Book", "Confirm"], moduleId: "book", entityId: "appointment" },
      { id: "wf-staff", name: "Serve customer", description: "Teller completes visit", roleId: "teller", steps: ["Queue", "Complete"], moduleId: "staff", entityId: "appointment" },
    ],
  },
  {
    slug: "insurtech",
    name: "Insurtech & Insurance Portals",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Policies & claims",
    description: "Lemonade-style policies, claims FNOL, adjuster workflow.",
    examples: ["Lemonade", "Geico", "Oscar Health"],
    productKind: "generic",
    brandName: "Verlin Cover",
    roles: [
      { id: "policyholder", label: "Policyholder", description: "Buy & claim", canCreate: true, isDefault: true },
      { id: "agent", label: "Agent", description: "Sell policies", canCreate: true, canManage: true },
      { id: "adjuster", label: "Claims adjuster", description: "Settle claims", canManage: true },
    ],
    entities: [
      ent("policy", "Policy", ["Active", "Pending", "Lapsed", "Cancelled"], ["title", "amount", "description", "status"], [
        { title: "Health Plus", amount: 12000, description: "Annual", status: "Active" },
        { title: "Auto Secure", amount: 8500, description: "Comprehensive", status: "Active" },
        { title: "Home Guard", amount: 6000, description: "Pending docs", status: "Pending" },
      ]),
      ent("claim", "Claim", ["FNOL", "Investigating", "Approved", "Denied"], ["title", "amount", "description", "status"], [
        { title: "Windshield", amount: 12000, description: "Auto", status: "FNOL" },
        { title: "Hospital bill", amount: 45000, description: "Health", status: "Investigating" },
        { title: "Phone theft", amount: 30000, description: "Denied proof", status: "Denied" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Coverage" },
      { id: "policies", title: "Policies", type: "list", entityId: "policy", description: "Your cover" },
      { id: "claim", title: "File claim", type: "form", entityId: "claim", description: "FNOL" },
      { id: "claims", title: "Claims", type: "board", entityId: "claim", description: "Track" },
      { id: "sell", title: "New policy", type: "form", entityId: "policy", roleIds: ["agent"], description: "Sell" },
      { id: "adjust", title: "Adjuster desk", type: "board", entityId: "claim", roleIds: ["adjuster"], description: "Settle" },
      { id: "settings", title: "Settings", type: "settings", description: "Documents" },
    ],
    workflows: [
      { id: "wf-claim", name: "File claim", description: "Policyholder FNOL", roleId: "policyholder", steps: ["File", "Track"], moduleId: "claim", entityId: "claim" },
      { id: "wf-sell", name: "Issue policy", description: "Agent sells", roleId: "agent", steps: ["New policy", "Active"], moduleId: "sell", entityId: "policy" },
      { id: "wf-adj", name: "Settle claim", description: "Adjuster decides", roleId: "adjuster", steps: ["Desk", "Approve/Deny"], moduleId: "adjust", entityId: "claim" },
    ],
  },
  {
    slug: "retail-investing",
    name: "Retail Investing & Brokerage",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Stocks, ETFs, funds",
    description: "Robinhood-style portfolio, orders, watchlist, compliance holds.",
    examples: ["Robinhood", "E*TRADE", "Webull"],
    productKind: "generic",
    brandName: "Verlin Invest",
    roles: [
      { id: "investor", label: "Investor", description: "Trade & watch", canCreate: true, isDefault: true },
      { id: "advisor", label: "Advisor", description: "Guided portfolios", canCreate: true, canManage: true },
      { id: "compliance", label: "Compliance", description: "Holds & reviews", canManage: true },
    ],
    entities: [
      ent("order", "Order", ["Open", "Filled", "Cancelled", "Held"], ["title", "amount", "description", "status"], [
        { title: "BUY NIFTYBEES", amount: 10000, description: "ETF", status: "Filled" },
        { title: "BUY RELIANCE", amount: 5, description: "Shares", status: "Open" },
        { title: "SELL TCS", amount: 2, description: "Shares", status: "Cancelled" },
        { title: "BUY penny", amount: 500, description: "Held KYC", status: "Held" },
      ]),
      ent("holding", "Holding", ["Gain", "Loss", "Flat"], ["title", "amount", "status"], [
        { title: "NIFTYBEES", amount: 12500, status: "Gain" },
        { title: "Cash", amount: 8000, status: "Flat" },
        { title: "Smallcap fund", amount: 4200, status: "Loss" },
      ]),
    ],
    modules: [
      { id: "home", title: "Portfolio", type: "dashboard", description: "Value" },
      { id: "holdings", title: "Holdings", type: "list", entityId: "holding", description: "Positions" },
      { id: "trade", title: "Trade", type: "form", entityId: "order", description: "Place order" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Order book" },
      { id: "compliance", title: "Compliance", type: "board", entityId: "order", roleIds: ["compliance"], description: "Holds" },
      { id: "settings", title: "Settings", type: "settings", description: "Risk profile" },
    ],
    workflows: [
      { id: "wf-trade", name: "Place trade", description: "Investor buys", roleId: "investor", steps: ["Trade", "Fill"], moduleId: "trade", entityId: "order" },
      { id: "wf-adv", name: "Advise client", description: "Advisor reviews", roleId: "advisor", steps: ["Portfolio", "Orders"], moduleId: "orders", entityId: "order" },
      { id: "wf-comp", name: "Release hold", description: "Compliance acts", roleId: "compliance", steps: ["Holds", "Release"], moduleId: "compliance", entityId: "order" },
    ],
  },
  {
    slug: "crypto-exchange",
    name: "Cryptocurrency Exchanges & Wallets",
    group: "fintech",
    groupLabel: G.fintech,
    tagline: "Buy, sell, store crypto",
    description: "Coinbase-style spot trades, wallets, deposits, compliance freezes.",
    examples: ["Coinbase", "Binance", "Trust Wallet"],
    productKind: "generic",
    brandName: "Verlin Crypto",
    roles: [
      { id: "trader", label: "Trader", description: "Trade assets", canCreate: true, isDefault: true },
      { id: "custody", label: "Custody ops", description: "Wallets", canManage: true, canCreate: true },
      { id: "compliance", label: "Compliance", description: "Freeze accounts", canManage: true },
    ],
    entities: [
      ent("trade", "Trade", ["Open", "Filled", "Cancelled", "Frozen"], ["title", "amount", "description", "status"], [
        { title: "BUY BTC", amount: 0.01, description: "Spot", status: "Filled" },
        { title: "BUY ETH", amount: 0.5, description: "Spot", status: "Open" },
        { title: "SELL SOL", amount: 10, description: "Spot", status: "Cancelled" },
        { title: "BUY meme", amount: 100, description: "Frozen", status: "Frozen" },
      ]),
      ent("wallet", "Wallet asset", ["Available", "In order", "Withdrawing"], ["title", "amount", "status"], [
        { title: "BTC", amount: 0.05, status: "Available" },
        { title: "USDT", amount: 1200, status: "Available" },
        { title: "ETH", amount: 0.2, status: "In order" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Portfolio" },
      { id: "wallets", title: "Wallets", type: "list", entityId: "wallet", description: "Assets" },
      { id: "trade", title: "Trade", type: "form", entityId: "trade", description: "Spot order" },
      { id: "orders", title: "Orders", type: "board", entityId: "trade", description: "Book" },
      { id: "compliance", title: "Compliance", type: "board", entityId: "trade", roleIds: ["compliance", "custody"], description: "Freezes" },
      { id: "settings", title: "Security", type: "settings", description: "2FA & devices" },
    ],
    workflows: [
      { id: "wf-trade", name: "Spot trade", description: "Trader buys crypto", roleId: "trader", steps: ["Trade", "Fill"], moduleId: "trade", entityId: "trade" },
      { id: "wf-cust", name: "Custody move", description: "Ops manages wallets", roleId: "custody", steps: ["Wallets"], moduleId: "wallets", entityId: "wallet" },
      { id: "wf-comp", name: "Freeze asset", description: "Compliance freezes", roleId: "compliance", steps: ["Compliance", "Freeze"], moduleId: "compliance", entityId: "trade" },
    ],
  },
  // —— 4. E-commerce ——
  {
    slug: "mass-marketplace",
    name: "Mass Marketplaces (E-commerce)",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Global shopping portals",
    description: "Amazon-style catalog, cart, orders, seller portal, returns.",
    examples: ["Amazon", "Temu", "eBay", "AliExpress"],
    productKind: "generic",
    brandName: "Verlin Market",
    roles: [
      { id: "buyer", label: "Buyer", description: "Shop & order", canCreate: true, isDefault: true },
      { id: "seller", label: "Seller", description: "List products", canCreate: true, canManage: true },
      { id: "ops", label: "Marketplace ops", description: "Disputes", canManage: true },
    ],
    entities: [
      ent("product", "Product", ["Active", "Out of stock", "Suspended"], ["title", "amount", "description", "status"], [
        { title: "Wireless earbuds", amount: 1999, description: "Electronics", status: "Active" },
        { title: "Yoga mat", amount: 899, description: "Sports", status: "Active" },
        { title: "USB hub", amount: 499, description: "OOS", status: "Out of stock" },
        { title: "Counterfeit watch", amount: 299, description: "Suspended", status: "Suspended" },
      ]),
      ent("order", "Order", ["Placed", "Shipped", "Delivered", "Returned"], ["title", "amount", "status"], [
        { title: "ORD-1001 earbuds", amount: 1999, status: "Shipped" },
        { title: "ORD-1002 mat", amount: 899, status: "Delivered" },
        { title: "ORD-1003 hub", amount: 499, status: "Returned" },
        { title: "ORD-1004", amount: 1200, status: "Placed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Deals" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "product", description: "Shop" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "My orders" },
      { id: "buy", title: "Place order", type: "form", entityId: "order", description: "Checkout" },
      { id: "seller", title: "Seller hub", type: "board", entityId: "product", roleIds: ["seller"], description: "Listings" },
      { id: "list", title: "Add listing", type: "form", entityId: "product", roleIds: ["seller"], description: "New SKU" },
      { id: "ops", title: "Disputes", type: "board", entityId: "order", roleIds: ["ops"], description: "Returns" },
      { id: "settings", title: "Settings", type: "settings", description: "Addresses" },
    ],
    workflows: [
      { id: "wf-buy", name: "Buy product", description: "Buyer checks out", roleId: "buyer", steps: ["Catalog", "Order", "Track"], moduleId: "buy", entityId: "order" },
      { id: "wf-sell", name: "List product", description: "Seller lists", roleId: "seller", steps: ["Add listing", "Active"], moduleId: "list", entityId: "product" },
      { id: "wf-ops", name: "Handle return", description: "Ops resolves", roleId: "ops", steps: ["Disputes", "Returned"], moduleId: "ops", entityId: "order" },
    ],
  },
  {
    slug: "food-delivery",
    name: "On-Demand Food Delivery",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Restaurant meals to door",
    description: "Uber Eats-style restaurants, cart, courier dispatch, live order states.",
    examples: ["Uber Eats", "DoorDash", "Swiggy"],
    productKind: "generic",
    brandName: "Verlin Eats",
    roles: [
      { id: "customer", label: "Customer", description: "Order food", canCreate: true, isDefault: true },
      { id: "restaurant", label: "Restaurant", description: "Accept orders", canManage: true, canCreate: true },
      { id: "courier", label: "Courier", description: "Deliver", canManage: true },
    ],
    entities: [
      ent("order", "Order", ["Placed", "Preparing", "On the way", "Delivered", "Cancelled"], ["title", "amount", "description", "status"], [
        { title: "Biryani bowl", amount: 320, description: "Spice Hub", status: "On the way" },
        { title: "Sushi set", amount: 890, description: "Tokyo Local", status: "Preparing" },
        { title: "Salad", amount: 250, description: "Green Bowl", status: "Delivered" },
        { title: "Pizza", amount: 450, description: "Cancelled stock", status: "Cancelled" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Nearby" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Track" },
      { id: "order", title: "New order", type: "form", entityId: "order", description: "Checkout" },
      { id: "kitchen", title: "Kitchen", type: "board", entityId: "order", roleIds: ["restaurant"], description: "Prep" },
      { id: "dispatch", title: "Dispatch", type: "board", entityId: "order", roleIds: ["courier"], description: "Deliveries" },
      { id: "settings", title: "Settings", type: "settings", description: "Addresses" },
    ],
    workflows: [
      { id: "wf-order", name: "Order meal", description: "Customer orders", roleId: "customer", steps: ["Order", "Track", "Delivered"], moduleId: "order", entityId: "order" },
      { id: "wf-kit", name: "Prepare order", description: "Restaurant preps", roleId: "restaurant", steps: ["Kitchen", "Preparing", "Ready"], moduleId: "kitchen", entityId: "order" },
      { id: "wf-del", name: "Deliver", description: "Courier delivers", roleId: "courier", steps: ["Dispatch", "On the way", "Delivered"], moduleId: "dispatch", entityId: "order" },
    ],
  },
  {
    slug: "grocery-qcommerce",
    name: "Grocery & Quick-Commerce",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Rapid grocery fulfillment",
    description: "Instacart/Getir-style SKUs, slots, pickers, dark-store stock.",
    examples: ["Instacart", "Getir", "Blinkit"],
    productKind: "generic",
    brandName: "Verlin Fresh",
    roles: [
      { id: "shopper", label: "Customer", description: "Order groceries", canCreate: true, isDefault: true },
      { id: "picker", label: "Picker", description: "Fulfill order", canManage: true },
      { id: "store", label: "Store manager", description: "Stock", canManage: true, canCreate: true },
    ],
    entities: [
      ent("order", "Grocery order", ["Placed", "Picking", "Out for delivery", "Delivered"], ["title", "amount", "status"], [
        { title: "Weekly essentials", amount: 1450, status: "Picking" },
        { title: "Milk & eggs", amount: 220, status: "Out for delivery" },
        { title: "Party pack", amount: 3200, status: "Delivered" },
        { title: "Snacks", amount: 380, status: "Placed" },
      ]),
      ent("sku", "SKU", ["In stock", "Low", "OOS"], ["title", "amount", "status"], [
        { title: "Organic milk 1L", amount: 72, status: "In stock" },
        { title: "Sourdough", amount: 90, status: "Low" },
        { title: "Avocado", amount: 40, status: "OOS" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "10-min delivery" },
      { id: "shop", title: "Shop", type: "list", entityId: "sku", description: "Catalog" },
      { id: "order", title: "Checkout", type: "form", entityId: "order", description: "Place order" },
      { id: "orders", title: "My orders", type: "board", entityId: "order", description: "Track" },
      { id: "pick", title: "Pick queue", type: "board", entityId: "order", roleIds: ["picker"], description: "Fulfill" },
      { id: "stock", title: "Stock", type: "board", entityId: "sku", roleIds: ["store"], description: "Inventory" },
      { id: "settings", title: "Settings", type: "settings", description: "Delivery slot" },
    ],
    workflows: [
      { id: "wf-shop", name: "Order groceries", description: "Customer checks out", roleId: "shopper", steps: ["Shop", "Checkout", "Track"], moduleId: "order", entityId: "order" },
      { id: "wf-pick", name: "Pick order", description: "Picker fulfills", roleId: "picker", steps: ["Pick", "Out for delivery"], moduleId: "pick", entityId: "order" },
      { id: "wf-stock", name: "Restock SKU", description: "Manager restocks", roleId: "store", steps: ["Stock", "In stock"], moduleId: "stock", entityId: "sku" },
    ],
  },
  {
    slug: "secondhand-marketplace",
    name: "Second-Hand Marketplaces",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "P2P used goods",
    description: "Vinted/eBay used: listings, offers, shipping, disputes.",
    examples: ["Vinted", "eBay", "Poshmark"],
    productKind: "generic",
    brandName: "Verlin Reuse",
    roles: [
      { id: "buyer", label: "Buyer", description: "Make offers", canCreate: true, isDefault: true },
      { id: "seller", label: "Seller", description: "List items", canCreate: true, canManage: true },
      { id: "support", label: "Trust support", description: "Disputes", canManage: true },
    ],
    entities: [
      ent("listing", "Listing", ["Active", "Reserved", "Sold", "Removed"], ["title", "amount", "description", "status"], [
        { title: "Vintage denim", amount: 1200, description: "M", status: "Active" },
        { title: "iPhone 12", amount: 18000, description: "Good", status: "Reserved" },
        { title: "Desk lamp", amount: 600, description: "Sold", status: "Sold" },
        { title: "Fake bag", amount: 900, description: "Removed", status: "Removed" },
      ]),
      ent("offer", "Offer", ["Pending", "Accepted", "Declined"], ["title", "amount", "status"], [
        { title: "Offer on denim", amount: 1000, status: "Pending" },
        { title: "Offer on lamp", amount: 550, status: "Accepted" },
      ]),
    ],
    modules: [
      { id: "home", title: "Browse", type: "dashboard", description: "Discover" },
      { id: "listings", title: "Listings", type: "list", entityId: "listing", description: "Items" },
      { id: "sell", title: "Sell item", type: "form", entityId: "listing", roleIds: ["seller", "buyer"], description: "List" },
      { id: "offers", title: "Offers", type: "board", entityId: "offer", description: "Negotiate" },
      { id: "offer", title: "Make offer", type: "form", entityId: "offer", description: "Bid" },
      { id: "support", title: "Disputes", type: "board", entityId: "listing", roleIds: ["support"], description: "Trust" },
      { id: "settings", title: "Settings", type: "settings", description: "Shipping" },
    ],
    workflows: [
      { id: "wf-buy", name: "Make offer", description: "Buyer offers", roleId: "buyer", steps: ["Browse", "Offer"], moduleId: "offer", entityId: "offer" },
      { id: "wf-sell", name: "Sell item", description: "Seller lists", roleId: "seller", steps: ["Sell", "Active", "Sold"], moduleId: "sell", entityId: "listing" },
      { id: "wf-sup", name: "Resolve dispute", description: "Support removes", roleId: "support", steps: ["Disputes", "Remove"], moduleId: "support", entityId: "listing" },
    ],
  },
  {
    slug: "brand-shopping",
    name: "Brand-Specific Shopping Apps",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "DTC brand store",
    description: "Nike-style catalog, sizes, membership, store pickup.",
    examples: ["Nike", "H&M", "Zara", "SHEIN"],
    productKind: "generic",
    brandName: "Verlin Apparel",
    roles: [
      { id: "shopper", label: "Shopper", description: "Browse & buy", canCreate: true, isDefault: true },
      { id: "member", label: "Members club", description: "Early access", canCreate: true, canManage: true },
      { id: "store", label: "Store associate", description: "Pickup orders", canManage: true },
    ],
    entities: [
      ent("product", "Product", ["In stock", "Low stock", "Sold out"], ["title", "amount", "level", "status"], [
        { title: "Runner Pro", amount: 8999, level: "42", status: "In stock" },
        { title: "City Hoodie", amount: 3499, level: "M", status: "Low stock" },
        { title: "Cap classic", amount: 999, level: "OS", status: "Sold out" },
      ]),
      ent("order", "Order", ["Paid", "Packing", "Ready for pickup", "Completed"], ["title", "amount", "status"], [
        { title: "Runner Pro", amount: 8999, status: "Ready for pickup" },
        { title: "Hoodie", amount: 3499, status: "Packing" },
      ]),
    ],
    modules: [
      { id: "home", title: "Shop", type: "dashboard", description: "New drops" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "product", description: "Products" },
      { id: "order", title: "Checkout", type: "form", entityId: "order", description: "Buy" },
      { id: "orders", title: "Orders", type: "board", entityId: "order", description: "Track" },
      { id: "pickup", title: "Store pickup", type: "board", entityId: "order", roleIds: ["store"], description: "Counter" },
      { id: "settings", title: "Membership", type: "settings", description: "Club" },
    ],
    workflows: [
      { id: "wf-buy", name: "Buy product", description: "Shopper checks out", roleId: "shopper", steps: ["Catalog", "Checkout"], moduleId: "order", entityId: "order" },
      { id: "wf-mem", name: "Member drop", description: "Early access", roleId: "member", steps: ["Shop", "Buy"], moduleId: "home" },
      { id: "wf-pick", name: "Hand over pickup", description: "Store completes", roleId: "store", steps: ["Pickup", "Completed"], moduleId: "pickup", entityId: "order" },
    ],
  },
  {
    slug: "loyalty-cashback",
    name: "Loyalty, Coupons & Cashback",
    group: "ecommerce",
    groupLabel: G.ecommerce,
    tagline: "Rewards & cash back",
    description: "Rakuten-style offers, clipped coupons, cashback ledger.",
    examples: ["Rakuten", "Honey", "Ibotta"],
    productKind: "generic",
    brandName: "Verlin Rewards",
    roles: [
      { id: "member", label: "Member", description: "Clip & earn", canCreate: true, isDefault: true },
      { id: "partner", label: "Brand partner", description: "Create offers", canCreate: true, canManage: true },
      { id: "ops", label: "Rewards ops", description: "Payouts", canManage: true },
    ],
    entities: [
      ent("offer", "Offer", ["Live", "Clipped", "Expired", "Paused"], ["title", "amount", "description", "status"], [
        { title: "10% fashion", amount: 10, description: "Online", status: "Live" },
        { title: "₹100 grocery", amount: 100, description: "Clipped", status: "Clipped" },
        { title: "Weekend travel", amount: 5, description: "Expired", status: "Expired" },
        { title: "Partner draft", amount: 15, description: "Paused", status: "Paused" },
      ]),
      ent("payout", "Cashback", ["Pending", "Paid", "Failed"], ["title", "amount", "status"], [
        { title: "March cashback", amount: 420, status: "Paid" },
        { title: "April pending", amount: 180, status: "Pending" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "Earn" },
      { id: "offers", title: "Offers", type: "board", entityId: "offer", description: "Clip" },
      { id: "wallet", title: "Cashback", type: "list", entityId: "payout", description: "Ledger" },
      { id: "create", title: "Create offer", type: "form", entityId: "offer", roleIds: ["partner"], description: "Partner" },
      { id: "ops", title: "Payouts", type: "board", entityId: "payout", roleIds: ["ops"], description: "Ops" },
      { id: "settings", title: "Settings", type: "settings", description: "Linked cards" },
    ],
    workflows: [
      { id: "wf-clip", name: "Clip offer", description: "Member clips", roleId: "member", steps: ["Offers", "Clip"], moduleId: "offers", entityId: "offer" },
      { id: "wf-part", name: "Launch offer", description: "Partner goes live", roleId: "partner", steps: ["Create", "Live"], moduleId: "create", entityId: "offer" },
      { id: "wf-pay", name: "Pay cashback", description: "Ops pays", roleId: "ops", steps: ["Payouts", "Paid"], moduleId: "ops", entityId: "payout" },
    ],
  },
  // —— 5. Utilities ——
  {
    slug: "web-browsers",
    name: "Web Browsers",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "Surf the internet",
    description: "Chrome-style tabs, bookmarks, history, sync profiles.",
    examples: ["Chrome", "Safari", "Firefox"],
    productKind: "generic",
    brandName: "Verlin Browse",
    roles: [
      { id: "user", label: "User", description: "Browse & bookmark", canCreate: true, isDefault: true },
      { id: "family", label: "Family manager", description: "Supervised profiles", canManage: true },
      { id: "admin", label: "IT admin", description: "Enterprise policies", canManage: true },
    ],
    entities: [
      ent("tab", "Tab", ["Open", "Pinned", "Sleeping", "Closed"], ["title", "description", "status"], [
        { title: "verlinlabs.com", description: "Home", status: "Open" },
        { title: "Docs", description: "Pinned", status: "Pinned" },
        { title: "News", description: "Sleeping", status: "Sleeping" },
        { title: "Old tab", description: "Closed", status: "Closed" },
      ]),
      ent("bookmark", "Bookmark", ["Saved", "Folder", "Synced"], ["title", "description", "status"], [
        { title: "AI course", description: "Learning", status: "Saved" },
        { title: "Design refs", description: "Folder", status: "Folder" },
      ]),
    ],
    modules: [
      { id: "home", title: "Tabs", type: "dashboard", description: "Open tabs" },
      { id: "tabs", title: "All tabs", type: "board", entityId: "tab", description: "Manage" },
      { id: "bookmarks", title: "Bookmarks", type: "list", entityId: "bookmark", description: "Saved" },
      { id: "add", title: "Add bookmark", type: "form", entityId: "bookmark", description: "Save page" },
      { id: "policies", title: "Policies", type: "settings", roleIds: ["admin", "family"], description: "Restrictions" },
      { id: "settings", title: "Settings", type: "settings", description: "Sync" },
    ],
    workflows: [
      { id: "wf-browse", name: "Manage tabs", description: "User pins tab", roleId: "user", steps: ["Tabs", "Pin"], moduleId: "tabs", entityId: "tab" },
      { id: "wf-bm", name: "Save bookmark", description: "User bookmarks", roleId: "user", steps: ["Add"], moduleId: "add", entityId: "bookmark" },
      { id: "wf-it", name: "Set policy", description: "IT restricts", roleId: "admin", steps: ["Policies"], moduleId: "policies" },
    ],
  },
  {
    slug: "cloud-storage",
    name: "Cloud Storage & File Sharing",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "Backup & sync files",
    description: "Drive/Dropbox-style files, shares, storage tiers.",
    examples: ["Google Drive", "Dropbox", "OneDrive"],
    productKind: "generic",
    brandName: "Verlin Drive",
    roles: [
      { id: "user", label: "User", description: "Upload & share", canCreate: true, isDefault: true },
      { id: "collab", label: "Collaborator", description: "Edit shared", canCreate: true },
      { id: "admin", label: "Workspace admin", description: "Quotas", canManage: true },
    ],
    entities: [
      ent("file", "File", ["Private", "Shared", "Pending sync", "Deleted"], ["title", "description", "status"], [
        { title: "Q2 plan.docx", description: "Docs", status: "Shared" },
        { title: "Deck.pptx", description: "Sales", status: "Private" },
        { title: "Photo dump", description: "Syncing", status: "Pending sync" },
        { title: "Old zip", description: "Trash", status: "Deleted" },
      ]),
    ],
    modules: [
      { id: "home", title: "My Drive", type: "dashboard", description: "Storage" },
      { id: "files", title: "Files", type: "board", entityId: "file", description: "All files" },
      { id: "upload", title: "Upload", type: "form", entityId: "file", description: "New file" },
      { id: "shared", title: "Shared with me", type: "list", entityId: "file", description: "Collab" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Quotas" },
      { id: "settings", title: "Settings", type: "settings", description: "Sync" },
    ],
    workflows: [
      { id: "wf-up", name: "Upload file", description: "User uploads", roleId: "user", steps: ["Upload", "Private/Shared"], moduleId: "upload", entityId: "file" },
      { id: "wf-col", name: "Open shared", description: "Collaborator edits", roleId: "collab", steps: ["Shared"], moduleId: "shared", entityId: "file" },
      { id: "wf-adm", name: "Manage quota", description: "Admin settings", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "password-managers",
    name: "Password Managers",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "Encrypted logins",
    description: "1Password-style vault items, sharing, breach alerts.",
    examples: ["1Password", "Bitwarden", "LastPass"],
    productKind: "generic",
    brandName: "Verlin Vault",
    roles: [
      { id: "user", label: "User", description: "Store secrets", canCreate: true, isDefault: true },
      { id: "family", label: "Family organizer", description: "Shared vaults", canManage: true, canCreate: true },
      { id: "admin", label: "Team admin", description: "Policies", canManage: true },
    ],
    entities: [
      ent("item", "Vault item", ["Active", "Shared", "Weak", "Breached"], ["title", "description", "status"], [
        { title: "GitHub", description: "work@", status: "Active" },
        { title: "Bank", description: "Shared spouse", status: "Shared" },
        { title: "Old forum", description: "Weak password", status: "Weak" },
        { title: "Shopping site", description: "Breach alert", status: "Breached" },
      ]),
    ],
    modules: [
      { id: "home", title: "Vault", type: "dashboard", description: "Security score" },
      { id: "items", title: "Items", type: "board", entityId: "item", description: "All logins" },
      { id: "add", title: "Add item", type: "form", entityId: "item", description: "New secret" },
      { id: "watchtower", title: "Watchtower", type: "list", entityId: "item", description: "Weak/breached" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin", "family"], description: "Policies" },
      { id: "settings", title: "Settings", type: "settings", description: "Autofill" },
    ],
    workflows: [
      { id: "wf-add", name: "Save password", description: "User adds item", roleId: "user", steps: ["Add", "Active"], moduleId: "add", entityId: "item" },
      { id: "wf-share", name: "Share vault item", description: "Family shares", roleId: "family", steps: ["Items", "Shared"], moduleId: "items", entityId: "item" },
      { id: "wf-adm", name: "Enforce policy", description: "Admin reviews", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "mfa-authenticators",
    name: "Multi-Factor Authenticators",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "OTP codes",
    description: "Authenticator app: accounts, TOTP codes, backup, device transfer.",
    examples: ["Google Authenticator", "Microsoft Authenticator", "Duo"],
    productKind: "generic",
    brandName: "Verlin Auth",
    roles: [
      { id: "user", label: "User", description: "Generate codes", canCreate: true, isDefault: true },
      { id: "it", label: "IT admin", description: "Enterprise enroll", canManage: true, canCreate: true },
      { id: "support", label: "Support", description: "Recovery", canManage: true },
    ],
    entities: [
      ent("account", "MFA account", ["Active", "Needs backup", "Revoked"], ["title", "description", "status"], [
        { title: "GitHub", description: "TOTP", status: "Active" },
        { title: "AWS", description: "Needs backup codes", status: "Needs backup" },
        { title: "Old VPN", description: "Revoked", status: "Revoked" },
        { title: "Email", description: "TOTP", status: "Active" },
      ]),
    ],
    modules: [
      { id: "home", title: "Codes", type: "dashboard", description: "Current OTPs" },
      { id: "accounts", title: "Accounts", type: "list", entityId: "account", description: "Enrolled" },
      { id: "add", title: "Add account", type: "form", entityId: "account", description: "Scan setup" },
      { id: "it", title: "IT console", type: "board", entityId: "account", roleIds: ["it"], description: "Enroll" },
      { id: "recovery", title: "Recovery", type: "list", entityId: "account", roleIds: ["support"], description: "Help" },
      { id: "settings", title: "Settings", type: "settings", description: "Transfer device" },
    ],
    workflows: [
      { id: "wf-add", name: "Enroll MFA", description: "User adds account", roleId: "user", steps: ["Add", "Active"], moduleId: "add", entityId: "account" },
      { id: "wf-it", name: "IT enroll", description: "IT manages", roleId: "it", steps: ["IT console"], moduleId: "it", entityId: "account" },
      { id: "wf-rec", name: "Recover access", description: "Support helps", roleId: "support", steps: ["Recovery"], moduleId: "recovery" },
    ],
  },
  {
    slug: "weather-forecasting",
    name: "Weather Forecasting",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "Local weather & alerts",
    description: "AccuWeather-style locations, hourly, severe alerts.",
    examples: ["AccuWeather", "Weather Channel", "CARROT"],
    productKind: "generic",
    brandName: "Verlin Weather",
    roles: [
      { id: "user", label: "User", description: "Check forecasts", canCreate: true, isDefault: true },
      { id: "pro", label: "Pro subscriber", description: "Radar layers", canCreate: true, canManage: true },
      { id: "editor", label: "Alert editor", description: "Push alerts", canManage: true, canCreate: true },
    ],
    entities: [
      ent("location", "Location", ["Home", "Work", "Saved", "Alerting"], ["title", "description", "status"], [
        { title: "Bengaluru", description: "28° · Clear", status: "Home" },
        { title: "Mumbai", description: "Rain likely", status: "Alerting" },
        { title: "Office", description: "Saved", status: "Work" },
        { title: "Goa trip", description: "Weekend", status: "Saved" },
      ]),
      ent("alert", "Alert", ["Active", "Sent", "Expired"], ["title", "description", "status"], [
        { title: "Heavy rain", description: "Mumbai", status: "Active" },
        { title: "Heat advisory", description: "Delhi", status: "Sent" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Now" },
      { id: "locations", title: "Locations", type: "list", entityId: "location", description: "Saved places" },
      { id: "add", title: "Add place", type: "form", entityId: "location", description: "New city" },
      { id: "alerts", title: "Alerts", type: "board", entityId: "alert", description: "Severe weather" },
      { id: "publish", title: "Publish alert", type: "form", entityId: "alert", roleIds: ["editor"], description: "Editor" },
      { id: "settings", title: "Settings", type: "settings", description: "Units" },
    ],
    workflows: [
      { id: "wf-check", name: "Check weather", description: "User views today", roleId: "user", steps: ["Today", "Locations"], moduleId: "home" },
      { id: "wf-pro", name: "Track alerts", description: "Pro monitors", roleId: "pro", steps: ["Alerts"], moduleId: "alerts", entityId: "alert" },
      { id: "wf-ed", name: "Publish alert", description: "Editor sends", roleId: "editor", steps: ["Publish", "Active"], moduleId: "publish", entityId: "alert" },
    ],
  },
  {
    slug: "vpn-privacy",
    name: "VPNs & Privacy Tools",
    group: "utilities",
    groupLabel: G.utilities,
    tagline: "Encrypt traffic",
    description: "NordVPN-style connect, servers, kill switch, devices.",
    examples: ["NordVPN", "ExpressVPN", "ProtonVPN"],
    productKind: "generic",
    brandName: "Verlin Shield",
    roles: [
      { id: "user", label: "User", description: "Connect VPN", canCreate: true, isDefault: true },
      { id: "family", label: "Plan owner", description: "Seats", canManage: true },
      { id: "support", label: "Support", description: "Connection issues", canManage: true },
    ],
    entities: [
      ent("session", "VPN session", ["Connected", "Connecting", "Disconnected", "Error"], ["title", "description", "status"], [
        { title: "India · Mumbai", description: "WireGuard", status: "Connected" },
        { title: "Germany · Frankfurt", description: "Streaming", status: "Disconnected" },
        { title: "US · NYC", description: "Error", status: "Error" },
        { title: "Auto", description: "Fastest", status: "Connecting" },
      ]),
    ],
    modules: [
      { id: "home", title: "Connect", type: "dashboard", description: "Status" },
      { id: "servers", title: "Servers", type: "list", entityId: "session", description: "Locations" },
      { id: "connect", title: "Quick connect", type: "form", entityId: "session", description: "Start" },
      { id: "devices", title: "Devices", type: "settings", description: "Seats" },
      { id: "support", title: "Support", type: "list", entityId: "session", roleIds: ["support"], description: "Errors" },
      { id: "settings", title: "Settings", type: "settings", description: "Kill switch" },
    ],
    workflows: [
      { id: "wf-con", name: "Connect VPN", description: "User connects", roleId: "user", steps: ["Connect", "Connected"], moduleId: "connect", entityId: "session" },
      { id: "wf-fam", name: "Manage seats", description: "Plan owner", roleId: "family", steps: ["Devices"], moduleId: "devices" },
      { id: "wf-sup", name: "Fix errors", description: "Support reviews", roleId: "support", steps: ["Support"], moduleId: "support", entityId: "session" },
    ],
  },
  // —— 6. Productivity ——
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
  },
  // —— 7. Education ——
  {
    slug: "language-learning",
    name: "Language Learning",
    group: "education",
    groupLabel: G.education,
    tagline: "Gamified language drills",
    description: "Duolingo-style lessons, streaks, skills tree, teacher view.",
    examples: ["Duolingo", "Babbel", "Memrise"],
    productKind: "generic",
    brandName: "Verlin Lingua",
    roles: [
      { id: "learner", label: "Learner", description: "Daily lessons", canCreate: true, isDefault: true },
      { id: "teacher", label: "Teacher", description: "Class progress", canManage: true },
      { id: "admin", label: "Curriculum admin", description: "Skills content", canManage: true, canCreate: true },
    ],
    entities: [
      ent("lesson", "Lesson", ["Available", "In progress", "Mastered", "Locked"], ["title", "description", "status"], [
        { title: "Spanish Greetings", description: "Unit 1", status: "Mastered" },
        { title: "Food vocab", description: "Unit 2", status: "In progress" },
        { title: "Past tense", description: "Unit 3", status: "Available" },
        { title: "Subjunctive", description: "Locked", status: "Locked" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Streak" },
      { id: "path", title: "Path", type: "board", entityId: "lesson", description: "Skills" },
      { id: "practice", title: "Practice", type: "form", entityId: "lesson", description: "Drill" },
      { id: "class", title: "Class", type: "list", entityId: "lesson", roleIds: ["teacher"], description: "Students" },
      { id: "curriculum", title: "Curriculum", type: "board", entityId: "lesson", roleIds: ["admin"], description: "Content" },
      { id: "settings", title: "Settings", type: "settings", description: "Goals" },
    ],
    workflows: [
      { id: "wf-learn", name: "Complete lesson", description: "Learner practices", roleId: "learner", steps: ["Path", "Practice", "Mastered"], moduleId: "practice", entityId: "lesson" },
      { id: "wf-teach", name: "Review class", description: "Teacher checks", roleId: "teacher", steps: ["Class"], moduleId: "class" },
      { id: "wf-cur", name: "Publish skill", description: "Admin unlocks", roleId: "admin", steps: ["Curriculum"], moduleId: "curriculum", entityId: "lesson" },
    ],
  },
  {
    slug: "online-learning-moocs",
    name: "Online Learning & MOOCs",
    group: "education",
    groupLabel: G.education,
    tagline: "Courses & certificates",
    description: "Coursera-style courses, enrollments, instructor studio.",
    examples: ["Coursera", "Udemy", "Khan Academy", "MasterClass"],
    productKind: "generic",
    brandName: "Verlin Learn",
    roles: [
      { id: "student", label: "Student", description: "Enroll & learn", canCreate: true, isDefault: true },
      { id: "instructor", label: "Instructor", description: "Publish courses", canCreate: true, canManage: true },
      { id: "admin", label: "Platform admin", description: "Catalog QA", canManage: true },
    ],
    entities: [
      ent("course", "Course", ["Open", "In progress", "Completed", "Archived"], ["title", "memberName", "description", "status"], [
        { title: "AI for PMs", memberName: "Verlin", description: "12 lessons", status: "In progress" },
        { title: "SQL fundamentals", memberName: "Asha", description: "Beginner", status: "Open" },
        { title: "Leadership", memberName: "Guest", description: "Done", status: "Completed" },
        { title: "Legacy course", memberName: "Ops", description: "Archived", status: "Archived" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "My learning" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "course", description: "Browse" },
      { id: "enroll", title: "Enroll", type: "form", entityId: "course", description: "Join course" },
      { id: "studio", title: "Instructor studio", type: "board", entityId: "course", roleIds: ["instructor"], description: "Publish" },
      { id: "create", title: "New course", type: "form", entityId: "course", roleIds: ["instructor"], description: "Create" },
      { id: "admin", title: "Admin", type: "board", entityId: "course", roleIds: ["admin"], description: "QA" },
      { id: "settings", title: "Settings", type: "settings", description: "Certificates" },
    ],
    workflows: [
      { id: "wf-enroll", name: "Enroll & complete", description: "Student learns", roleId: "student", steps: ["Catalog", "Enroll", "Completed"], moduleId: "enroll", entityId: "course" },
      { id: "wf-teach", name: "Publish course", description: "Instructor ships", roleId: "instructor", steps: ["Create", "Open"], moduleId: "create", entityId: "course" },
      { id: "wf-adm", name: "QA catalog", description: "Admin archives", roleId: "admin", steps: ["Admin"], moduleId: "admin", entityId: "course" },
    ],
  },
  {
    slug: "lms-classroom",
    name: "Learning Management Systems",
    group: "education",
    groupLabel: G.education,
    tagline: "School assignments & grades",
    description: "Google Classroom-style classes, assignments, submissions, grades.",
    examples: ["Google Classroom", "Canvas", "Blackboard"],
    productKind: "generic",
    brandName: "Verlin Classroom",
    roles: [
      { id: "student", label: "Student", description: "Submit work", canCreate: true, isDefault: true },
      { id: "teacher", label: "Teacher", description: "Assign & grade", canCreate: true, canManage: true },
      { id: "admin", label: "School admin", description: "Rosters", canManage: true },
    ],
    entities: [
      ent("assignment", "Assignment", ["Assigned", "Submitted", "Graded", "Late"], ["title", "description", "status"], [
        { title: "Essay 1", description: "Due Fri", status: "Assigned" },
        { title: "Lab report", description: "Submitted", status: "Submitted" },
        { title: "Quiz 3", description: "A-", status: "Graded" },
        { title: "Project", description: "Late", status: "Late" },
      ]),
    ],
    modules: [
      { id: "home", title: "Classwork", type: "dashboard", description: "Due soon" },
      { id: "work", title: "Assignments", type: "board", entityId: "assignment", description: "All work" },
      { id: "submit", title: "Submit", type: "form", entityId: "assignment", description: "Turn in" },
      { id: "grade", title: "Gradebook", type: "board", entityId: "assignment", roleIds: ["teacher"], description: "Grade" },
      { id: "create", title: "New assignment", type: "form", entityId: "assignment", roleIds: ["teacher"], description: "Create" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Rosters" },
      { id: "settings", title: "Settings", type: "settings", description: "Notifications" },
    ],
    workflows: [
      { id: "wf-sub", name: "Submit work", description: "Student submits", roleId: "student", steps: ["Submit", "Submitted"], moduleId: "submit", entityId: "assignment" },
      { id: "wf-grade", name: "Grade work", description: "Teacher grades", roleId: "teacher", steps: ["Gradebook", "Graded"], moduleId: "grade", entityId: "assignment" },
      { id: "wf-adm", name: "Manage roster", description: "Admin settings", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "flashcards",
    name: "Flashcard & Active Recall Tools",
    group: "education",
    groupLabel: G.education,
    tagline: "Spaced repetition",
    description: "Anki/Quizlet decks, cards, review queue, mastery.",
    examples: ["Quizlet", "Anki"],
    productKind: "generic",
    brandName: "Verlin Cards",
    roles: [
      { id: "learner", label: "Learner", description: "Review cards", canCreate: true, isDefault: true },
      { id: "author", label: "Deck author", description: "Create decks", canCreate: true, canManage: true },
      { id: "teacher", label: "Teacher", description: "Assign decks", canManage: true },
    ],
    entities: [
      ent("card", "Card", ["New", "Learning", "Review", "Mastered"], ["title", "description", "status"], [
        { title: "What is a mental model?", description: "Front/back", status: "Review" },
        { title: "SQL JOIN types", description: "Drill", status: "Learning" },
        { title: "Capitals", description: "Geo", status: "Mastered" },
        { title: "New term", description: "Added today", status: "New" },
      ]),
    ],
    modules: [
      { id: "home", title: "Review", type: "dashboard", description: "Due today" },
      { id: "deck", title: "Deck", type: "board", entityId: "card", description: "All cards" },
      { id: "add", title: "Add card", type: "form", entityId: "card", description: "New card" },
      { id: "teach", title: "Class decks", type: "list", entityId: "card", roleIds: ["teacher"], description: "Assign" },
      { id: "settings", title: "Settings", type: "settings", description: "SRS intervals" },
    ],
    workflows: [
      { id: "wf-rev", name: "Review due cards", description: "Learner reviews", roleId: "learner", steps: ["Review", "Mastered"], moduleId: "home", entityId: "card" },
      { id: "wf-add", name: "Author cards", description: "Author adds", roleId: "author", steps: ["Add", "New"], moduleId: "add", entityId: "card" },
      { id: "wf-teach", name: "Assign deck", description: "Teacher assigns", roleId: "teacher", steps: ["Class decks"], moduleId: "teach" },
    ],
  },
  {
    slug: "brain-training",
    name: "Brain Training & Mental Gyms",
    group: "education",
    groupLabel: G.education,
    tagline: "Cognitive games",
    description: "Lumosity-style games, scores, daily workouts, coach plans.",
    examples: ["Lumosity", "Peak", "Elevate"],
    productKind: "generic",
    brandName: "Verlin Mind Gym",
    roles: [
      { id: "player", label: "Player", description: "Play games", canCreate: true, isDefault: true },
      { id: "coach", label: "Coach", description: "Assign workouts", canManage: true, canCreate: true },
      { id: "admin", label: "Content admin", description: "Games catalog", canManage: true },
    ],
    entities: [
      ent("session", "Workout", ["Available", "In progress", "Completed", "Skipped"], ["title", "score", "description", "status"], [
        { title: "Memory match", score: 820, description: "Daily", status: "Completed" },
        { title: "Focus flow", score: 0, description: "Today", status: "Available" },
        { title: "Speed math", score: 640, description: "In progress", status: "In progress" },
        { title: "Rest day", score: 0, description: "Skipped", status: "Skipped" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Workout" },
      { id: "games", title: "Games", type: "board", entityId: "session", description: "Sessions" },
      { id: "play", title: "Start game", type: "form", entityId: "session", description: "Play" },
      { id: "coach", title: "Coach plans", type: "list", entityId: "session", roleIds: ["coach"], description: "Assign" },
      { id: "admin", title: "Catalog", type: "list", entityId: "session", roleIds: ["admin"], description: "Games" },
      { id: "settings", title: "Settings", type: "settings", description: "Difficulty" },
    ],
    workflows: [
      { id: "wf-play", name: "Complete workout", description: "Player finishes", roleId: "player", steps: ["Start", "Completed"], moduleId: "play", entityId: "session" },
      { id: "wf-coach", name: "Assign workout", description: "Coach plans", roleId: "coach", steps: ["Coach plans"], moduleId: "coach" },
      { id: "wf-adm", name: "Manage games", description: "Admin catalog", roleId: "admin", steps: ["Catalog"], moduleId: "admin" },
    ],
  },
  // —— 8. Health ——
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
  },
  // —— 9. Travel ——
  {
    slug: "ride-sharing",
    name: "Ride-Sharing & Ride-Hailing",
    group: "travel",
    groupLabel: G.travel,
    tagline: "Book a ride now",
    description: "Uber-style requests, driver accept, live trip, safety.",
    examples: ["Uber", "Lyft", "Grab", "Bolt"],
    productKind: "generic",
    brandName: "Verlin Ride",
    roles: [
      { id: "rider", label: "Rider", description: "Request rides", canCreate: true, isDefault: true },
      { id: "driver", label: "Driver", description: "Accept trips", canManage: true, canCreate: true },
      { id: "ops", label: "Dispatch ops", description: "Safety & disputes", canManage: true },
    ],
    entities: [
      ent("trip", "Trip", ["Requested", "Accepted", "In trip", "Completed", "Cancelled"], ["title", "amount", "description", "status"], [
        { title: "Home → Office", amount: 180, description: "Auto", status: "In trip" },
        { title: "Airport", amount: 650, description: "Sedan", status: "Requested" },
        { title: "Mall", amount: 120, description: "Done", status: "Completed" },
        { title: "Cancelled", amount: 0, description: "No drivers", status: "Cancelled" },
      ]),
    ],
    modules: [
      { id: "home", title: "Ride", type: "dashboard", description: "Map" },
      { id: "request", title: "Request ride", type: "form", entityId: "trip", description: "Book" },
      { id: "trips", title: "My trips", type: "board", entityId: "trip", description: "History" },
      { id: "driver", title: "Driver jobs", type: "board", entityId: "trip", roleIds: ["driver"], description: "Accept" },
      { id: "ops", title: "Ops", type: "board", entityId: "trip", roleIds: ["ops"], description: "Safety" },
      { id: "settings", title: "Settings", type: "settings", description: "Payment" },
    ],
    workflows: [
      { id: "wf-ride", name: "Take a ride", description: "Rider requests", roleId: "rider", steps: ["Request", "In trip", "Completed"], moduleId: "request", entityId: "trip" },
      { id: "wf-drv", name: "Complete trip", description: "Driver accepts", roleId: "driver", steps: ["Jobs", "Accepted", "Completed"], moduleId: "driver", entityId: "trip" },
      { id: "wf-ops", name: "Handle safety", description: "Ops intervenes", roleId: "ops", steps: ["Ops"], moduleId: "ops", entityId: "trip" },
    ],
  },
  {
    slug: "navigation-maps",
    name: "Navigation & Digital Mapping",
    group: "travel",
    groupLabel: G.travel,
    tagline: "GPS & traffic",
    description: "Google Maps-style routes, traffic, saved places, contrib edits.",
    examples: ["Google Maps", "Waze", "Apple Maps"],
    productKind: "generic",
    brandName: "Verlin Maps",
    roles: [
      { id: "driver", label: "Navigator", description: "Get directions", canCreate: true, isDefault: true },
      { id: "contributor", label: "Map contributor", description: "Report issues", canCreate: true, canManage: true },
      { id: "ops", label: "Map ops", description: "Validate edits", canManage: true },
    ],
    entities: [
      ent("route", "Route", ["Suggested", "Navigating", "Arrived", "Rerouted"], ["title", "description", "status"], [
        { title: "Home → Airport", description: "45 min · traffic", status: "Suggested" },
        { title: "Office commute", description: "Navigating", status: "Navigating" },
        { title: "Weekend trip", description: "Arrived", status: "Arrived" },
        { title: "Accident ahead", description: "Rerouted", status: "Rerouted" },
      ]),
      ent("report", "Map report", ["Open", "Verified", "Rejected"], ["title", "description", "status"], [
        { title: "Road closure", description: "MG Road", status: "Open" },
        { title: "Speed camera", description: "Verified", status: "Verified" },
      ]),
    ],
    modules: [
      { id: "home", title: "Explore", type: "dashboard", description: "Search" },
      { id: "routes", title: "Routes", type: "list", entityId: "route", description: "Directions" },
      { id: "go", title: "Start nav", type: "form", entityId: "route", description: "Navigate" },
      { id: "report", title: "Report issue", type: "form", entityId: "report", description: "Contribute" },
      { id: "ops", title: "Edit queue", type: "board", entityId: "report", roleIds: ["ops"], description: "Validate" },
      { id: "settings", title: "Settings", type: "settings", description: "Voice & offline" },
    ],
    workflows: [
      { id: "wf-nav", name: "Navigate", description: "User starts nav", roleId: "driver", steps: ["Start nav", "Arrived"], moduleId: "go", entityId: "route" },
      { id: "wf-rep", name: "Report hazard", description: "Contributor reports", roleId: "contributor", steps: ["Report", "Open"], moduleId: "report", entityId: "report" },
      { id: "wf-ops", name: "Verify edit", description: "Ops verifies", roleId: "ops", steps: ["Edit queue", "Verified"], moduleId: "ops", entityId: "report" },
    ],
  },
  {
    slug: "travel-booking",
    name: "Travel Booking & Lodging",
    group: "travel",
    groupLabel: G.travel,
    tagline: "Flights, hotels, stays",
    description: "Airbnb/Booking-style stays, host calendar, guest trips, support.",
    examples: ["Airbnb", "Booking.com", "Expedia"],
    productKind: "booking",
    brandName: "Verlin Stays",
    roles: [
      { id: "guest", label: "Guest", description: "Book stays", canCreate: true, isDefault: true },
      { id: "host", label: "Host", description: "Manage listings", canCreate: true, canManage: true },
      { id: "support", label: "Trip support", description: "Issues", canManage: true },
    ],
    entities: [
      ent("stay", "Stay", ["Available", "Booked", "Checked in", "Completed", "Cancelled"], ["title", "amount", "when", "status"], [
        { title: "Indiranagar loft", amount: 4200, when: "Fri–Sun", status: "Booked" },
        { title: "Goa villa", amount: 12000, when: "Next week", status: "Available" },
        { title: "City hotel", amount: 3500, when: "Now", status: "Checked in" },
        { title: "Hill cabin", amount: 6000, when: "Last month", status: "Completed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Explore", type: "dashboard", description: "Stays" },
      { id: "stays", title: "Stays", type: "list", entityId: "stay", description: "Browse" },
      { id: "book", title: "Book", type: "form", entityId: "stay", description: "Reserve" },
      { id: "trips", title: "Trips", type: "board", entityId: "stay", description: "My trips" },
      { id: "host", title: "Host calendar", type: "schedule", entityId: "stay", roleIds: ["host"], description: "Listings" },
      { id: "list", title: "New listing", type: "form", entityId: "stay", roleIds: ["host"], description: "Host" },
      { id: "support", title: "Support", type: "board", entityId: "stay", roleIds: ["support"], description: "Cases" },
      { id: "settings", title: "Settings", type: "settings", description: "Payments" },
    ],
    workflows: [
      { id: "wf-book", name: "Book stay", description: "Guest books", roleId: "guest", steps: ["Browse", "Book", "Trip"], moduleId: "book", entityId: "stay" },
      { id: "wf-host", name: "Host guests", description: "Host manages", roleId: "host", steps: ["Calendar", "Checked in"], moduleId: "host", entityId: "stay" },
      { id: "wf-sup", name: "Resolve trip issue", description: "Support helps", roleId: "support", steps: ["Support"], moduleId: "support", entityId: "stay" },
    ],
  },
  {
    slug: "local-discovery",
    name: "Local Discovery & Reviews",
    group: "travel",
    groupLabel: G.travel,
    tagline: "Places & reviews",
    description: "Yelp-style places, ratings, photos, owner responses, trust queue.",
    examples: ["Yelp", "TripAdvisor", "Google Local"],
    productKind: "generic",
    brandName: "Verlin Local",
    roles: [
      { id: "seeker", label: "Explorer", description: "Find places", canCreate: true, isDefault: true },
      { id: "owner", label: "Business owner", description: "Claim & reply", canCreate: true, canManage: true },
      { id: "moderator", label: "Trust moderator", description: "Fake reviews", canManage: true },
    ],
    entities: [
      ent("place", "Place", ["Open", "Closed", "Temp closed", "Claimed"], ["title", "description", "status"], [
        { title: "Third Wave Coffee", description: "4.5 · Cafe", status: "Open" },
        { title: "Trattoria", description: "4.2 · Dinner", status: "Open" },
        { title: "Old bakery", description: "Closed", status: "Closed" },
        { title: "New salon", description: "Claimed", status: "Claimed" },
      ]),
      ent("review", "Review", ["Published", "Flagged", "Removed", "Owner replied"], ["title", "description", "amount", "status"], [
        { title: "Great pour-over", description: "Asha", amount: 5, status: "Published" },
        { title: "Slow service", description: "Rohan", amount: 2, status: "Owner replied" },
        { title: "Fake 5-star", description: "Bot", amount: 5, status: "Flagged" },
        { title: "Removed spam", description: "Mod", amount: 1, status: "Removed" },
      ]),
    ],
    modules: [
      { id: "home", title: "Discover", type: "dashboard", description: "Near you" },
      { id: "places", title: "Places", type: "list", entityId: "place", description: "Browse" },
      { id: "reviews", title: "Reviews", type: "board", entityId: "review", description: "Ratings" },
      { id: "write", title: "Write review", type: "form", entityId: "review", description: "Rate" },
      { id: "owner", title: "Owner desk", type: "board", entityId: "review", roleIds: ["owner"], description: "Replies" },
      { id: "mod", title: "Moderation", type: "board", entityId: "review", roleIds: ["moderator"], description: "Trust" },
      { id: "settings", title: "Settings", type: "settings", description: "City" },
    ],
    workflows: [
      { id: "wf-rev", name: "Write review", description: "Explorer rates place", roleId: "seeker", steps: ["Write", "Published"], moduleId: "write", entityId: "review" },
      { id: "wf-own", name: "Reply to review", description: "Owner responds", roleId: "owner", steps: ["Owner desk", "Replied"], moduleId: "owner", entityId: "review" },
      { id: "wf-mod", name: "Remove fake review", description: "Mod acts", roleId: "moderator", steps: ["Moderation", "Removed"], moduleId: "mod", entityId: "review" },
    ],
  },
];

export const DEMO_GROUP_ORDER: DemoGroupId[] = [
  "social",
  "entertainment",
  "fintech",
  "ecommerce",
  "utilities",
  "productivity",
  "education",
  "health",
  "travel",
];

export function getDemoCategory(slug: string): DemoCategoryDef | undefined {
  return DEMO_CATEGORIES.find((c) => c.slug === slug);
}

export function assertFiftyCategories(): void {
  if (DEMO_CATEGORIES.length !== 50) {
    throw new Error(`Expected 50 demo categories, got ${DEMO_CATEGORIES.length}`);
  }
  const slugs = new Set(DEMO_CATEGORIES.map((c) => c.slug));
  if (slugs.size !== 50) {
    throw new Error("Duplicate demo category slugs");
  }
}
