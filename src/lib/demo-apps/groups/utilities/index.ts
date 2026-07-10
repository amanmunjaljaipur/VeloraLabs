/**
 * Demo app categories: utilities
 * Deploy unit: src/lib/demo-apps/groups/utilities/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
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
  }
];

export default CATEGORIES;
