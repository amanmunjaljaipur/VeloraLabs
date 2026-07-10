/**
 * Demo app categories: social
 * Deploy unit: src/lib/demo-apps/groups/social/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
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
  }
];

export default CATEGORIES;
