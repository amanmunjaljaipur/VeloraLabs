/**
 * Demo app categories: travel
 * Deploy unit: src/lib/demo-apps/groups/travel/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
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
  }
];

export default CATEGORIES;
