---
name: verlin-product-builder
description: >
  Verlin Labs product-building skill: clarity-first thought process, how we ship
  hosted multi-tenant apps, guided interviews with suggestions, standalone auth/roles,
  location branding, and how to design new App Builder extensions (menus, questions,
  admin capabilities, packaging). Use when building or extending App Builder products,
  designing new extensions (ecom, booking, tuition, portfolio), writing interview
  questions/menus/roles, planning deployment for non-tech users, or when the user
  runs /verlin-product-builder or mentions App Builder extension, new product shape,
  guided questions, or how Verlin builds products.
---

# Verlin Product Builder

Use this skill whenever you **design, extend, or implement** products under Verlin Labs App Builder—or when teaching/replaying **how Verlin Labs itself was built**.

Read companion refs as needed:

- `references/verlin-thought-process.md` — how Verlin Labs was productized
- `references/extension-design.md` — menus, questions, roles, admin for new extensions
- `references/question-banks.md` — reusable interview banks by vertical

---

## Core principles (non-negotiable)

1. **One vertical first** — never “build anything.” Bound the extension (e.g. `ecom-local-shop`, later `booking-local`, `tuition-centre`).
2. **Non-tech first** — Class 6–12 parents / local shop owners language. No “LLM”, “OAuth”, “Blob”, “deploy pipeline” in UI copy.
3. **One prompt starts; interview is designed from that prompt** — never a fixed question list every time. Call `/api/admin/app-builder/interview` (Grok as product manager) via `designInterviewQuestions`. Fallback only if no LLM key.
4. **Suggestions + own words** — every question: chips to tap + "add your own." Language: Class-8 English, no tech jargon.
5. **Platform hosts by default** — live at `/apps/{slug}` on Verlin Labs. No user Vercel/Google Cloud. Optional static export folder for self-host.
6. **Request-only AI keys** — never store user API keys; provider + model name only.
7. **Standalone app chrome** — generated apps hide Verlin navbar, footer, platform admin, chatbot.
8. **Per-app tenancy** — separate login, roles, owner = creator + platform super_admin, default role = customer (or mass-relevant role).
9. **Honest automation** — auto what we can; checklist what humans must still do (Maps, custom domain).
10. **Persist for serverless** — `ensureDataFileHydrated(..., { force: true })` + `writeJsonFileAsync` for tenant/project data.

---

## How Verlin Labs was built (thought process to reuse)

```
Audience clarity  →  Offer clarity  →  Sitemap/journeys  →  Opinionated stack
      →  Admin for operators  →  Runtime data on Blob  →  SEO defaults
      →  Guided not magical  →  Measure & tighten
```

| Step | Verlin Labs did | App Builder must do for each new product |
|------|-----------------|------------------------------------------|
| Audience | Students / engineers / PMs | Who uses the *generated* app? (buyer, owner, staff) |
| Offer | Free session → courses | What can they *do* day one without tech? |
| Sitemap | Programs, learn, library, admin | Fixed pages per extension (not freeform SPA chaos) |
| Admin | CMS, CRM, roles, blog, chatbot | Shop/tenant admin only—relevant caps, not full VL admin |
| Data | Blob runtime files | `app-builder-projects` + `app-builder-tenants` + per-export folders |
| Auth | NextAuth + roles | **Separate** app cookie session + tenant roles |
| SEO | Metadata, sitemap | Brand title/desc, LocalBusiness when local, noindex drafts |
| Teaching | Mental models | Explain mode optional; always plain-language studio |

**Decision rule when stuck:** choose what a non-tech user finishes in 10 minutes without a developer.

---

## End-to-end flow (every generated product)

```
1. Idea cards + plain prompt
2. PM AI designs 7–10 questions from THIS prompt (not fixed bank)
3. User answers one-at-a-time (chips + custom)
4. Owner free-form extra points
5. User AI helper key (Grok / Groq / custom) — not stored — generate site
6. Persist project (await Blob) + init tenant (roles/members)
7. Package generated-apps/{slug}/ for self-host
8. Live at /apps/{slug} as standalone shell
9. Owner claims login; public gets default role
```

### Studio steps (labels for UI)

1. Your idea  
2. Guided questions  
3. Your own points  
4. AI helper  
5. Live app  

Do **not** expose “extension id”, “JSON schema”, “OpenAI-compatible” unless Advanced.

---

## Designing a **new** App Builder product (extension)

When the user asks for a new product type, follow this sequence **before coding**:

### A. Product brief (write it out)

```markdown
## Extension brief
- id: kebab-case (e.g. booking-local)
- plainLabel: one sentence a parent understands
- Primary user (owner): ...
- Primary user (visitor): ...
- Success metric: ...
- Non-goals: ...
- Public pages (sitemap): ...
- Admin menus: ...
- Default roles: ...
- Default role for new sign-ups: ...
- Location-sensitive? (colours/logo): yes/no
```

### B. Menus (public + admin)

**Public nav** (max 5–7 items): Home + core jobs + Contact/Help.  
**Admin nav** (staff only): Overview, core ops, Team, Roles, Settings.

Map each menu to **capabilities** (e.g. `orders.manage`, `products.edit`, `roles.manage`).

See `references/extension-design.md` for patterns.

### C. Interview questions (8–12)

For each question define:

| Field | Rule |
|-------|------|
| `id` | stable camelCase |
| `label` | plain question |
| `helpText` | coach line, no jargon |
| `selectMode` | `single` \| `multi` \| `free` |
| `suggestions` | 5–12 tappable chips |
| `allowCustom` | true by default |
| `required` | only for true blockers |
| `multiline` | for lists/stories |

**Always cover:** brand/name, location, who it’s for, what they offer, how people contact/order, tone/vibe, must-haves, optional extras.

Pull banks from `references/question-banks.md`.

### D. Content model

Define TypeScript content shape (like `EcomLocalShopContent`): brand, colours, location logo fields, page copy, list entities (products/services/slots), FAQs, CTAs, ownerHighlights.

### E. Roles (tenant)

Minimum set:

| Role id | Label | Default? | Capabilities |
|---------|-------|----------|--------------|
| `super_admin` | Owner | no | `*` |
| `admin` | Manager | no | ops + team (not destroy owner) |
| `staff` | Staff | no | day-to-day ops |
| mass role | Customer / Parent / Student… | **yes** | browse + own records |

Platform Verlin `super_admin` always bridges to app Owner. Creator email is Owner.

### F. Implementation checklist (code)

When implementing in this repo:

1. `types.ts` — extend `AppExtensionId` + content type  
2. `extensions.ts` — meta, idea cards, questions  
3. `default-roles.ts` or extension-specific defaults  
4. `generate.ts` — LLM prompt + template fallback  
5. `branding.ts` — if location matters  
6. Runtime component + routes under `/apps/[slug]`  
7. Tenant init on publish (`ensureTenantForProject`)  
8. Admin APIs under `/api/apps/[slug]/admin/*`  
9. Static packager if exportable  
10. Standalone shell (no VL chrome) via middleware `x-vl-app-shell`  
11. Await Blob on all tenant/project writes  

### G. Quality gates before “live”

- [ ] Required interview answers present  
- [ ] Contact path exists (phone/WhatsApp/email)  
- [ ] At least N real offer items (products/services)  
- [ ] Owner email known for tenancy  
- [ ] Draft stays noindex; live has title/description  
- [ ] Navigation works client-side without losing data  

---

## Question design rules (thought process)

Ask like a **friendly coach**, not a form:

1. **Start concrete** — name, city (unlocks branding).  
2. **Offer** — what they sell/do, with example chips.  
3. **Audience** — who buys (multi-select).  
4. **Channel** — WhatsApp/call/visit (India-first defaults).  
5. **Tone** — how the site should *feel*.  
6. **Must-haves** — their own points become “Why us”.  
7. **Skip optional** — never block on perfect data.

**Bad:** “Select your CRM integration surface.”  
**Good:** “How should people reach you? Tap all that fit.”

**Bad:** empty text box only.  
**Good:** chips + “Add my own.”

---

## Menu design rules

| Layer | Include | Exclude |
|-------|---------|---------|
| Public | Jobs visitor came for | Admin, platform, “Studio” |
| Admin | Only this app’s ops | Verlin CMS/CRM/blog/chatbot |
| Auth | Sign in / Join for *this* brand | Google/VL login unless bridged for platform SA |

Admin IA order: **Overview → primary ops → content → people → roles → settings**.

---

## Hosting & data (for agents)

| Concern | Decision |
|---------|----------|
| Deploy for non-tech | Hosted multi-tenant on Verlin; button = “Build my shop / Publish” |
| Data | Blob-backed JSON; force hydrate; never trust empty `/tmp` seed |
| Self-host | `generated-apps/{slug}/site/index.html` + Download |
| SEO | Platform defaults; share link + Google Business checklist later |
| Never ask user for | Vercel account, GCP, env files, GitHub |

---

## Agent response pattern

When asked to **add a new App Builder product**:

1. Output the **Extension brief** (section A).  
2. Output **public + admin menus** with capabilities.  
3. Output **full interview question list** (chips included).  
4. Output **roles table**.  
5. Output **content type sketch**.  
6. Only then implement code unless user asked plan-only.  
7. Keep UI copy non-technical; keep code paths opinionated.

When asked **how Verlin built X**: map to principles + the table above; cite existing modules (`src/lib/app-builder/*`, `/apps/[slug]`, tenant auth).

---

## Anti-patterns (reject or push back)

- Infinite “build any SaaS” scope  
- Storing user AI API keys  
- Requiring each customer’s Vercel project  
- Showing Verlin admin chrome inside `/apps/*`  
- Interview without suggestions  
- Sync Blob writes that vanish on navigation  
- Default role = admin for public sign-ups  

---

## Quick commands

- New extension design only → brief + menus + questions + roles (no code until approved if ambiguous).  
- Implement extension → follow checklist F + this skill’s principles.  
- Fix disappearing apps → persistence + client nav + force hydrate (already pattern in store).  
- Standalone auth issues → `app-session` cookie path `/`, tenant roles, owner claim via signup.
