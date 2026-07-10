/**
 * Demo app categories: entertainment
 * Deploy unit: src/lib/demo-apps/groups/entertainment/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
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
  }
];

export default CATEGORIES;
