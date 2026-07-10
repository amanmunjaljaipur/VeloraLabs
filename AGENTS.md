<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:app-builder-tour-default -->
## App Builder: guided tour updates by default

Whenever you change App Builder (admin menus, products, theme/logo, auth, public pages, settings), **update `src/components/app-builder/AppGuidedTour.tsx` in the same change** — add/adjust overlay steps, arrows, and `data-tour` hotspots so the tour matches the UI. Do not ship features the tour still describes incorrectly. See `.grok/skills/verlin-product-builder/SKILL.md` principle 11.
<!-- END:app-builder-tour-default -->

<!-- BEGIN:app-builder-agents-ops-memory -->
## App Builder: specialized agents + deploy-safe operational memory

**Orchestrator first** for multi-step work: skill `/app-builder-orchestrator`.

| Agent skill | Owns |
|-------------|------|
| `app-builder-orchestrator` | Route work, load memory, force research if missing |
| `app-vertical-research` | Research app type → save to ops DB immediately |
| `app-interview-agent` | Dynamic PM interview questions |
| `app-content-agent` | Copy, SEO, premiumization |
| `app-theme-agent` | Multi-colour theme, logo, photos |
| `verlin-product-builder` | Extension design / product judgment |
| `app-admin-agent` | Tenant admin menus & CMS |
| `app-auth-agent` | Per-app auth & roles |
| `app-tour-agent` | Guided tour always current |
| `app-experience-agent` | Log learnings to ops memory |
| `app-hosting-agent` | Blob, export, deploy safety |

### Operational memory (NOT reset by production deploys)

- **Blob file:** `app-builder-ops-memory.json` (runtime data — never git-seeded on Vercel)
- **Code:** `src/lib/app-builder/ops-memory.ts`, `vertical-research.ts`
- **API (super admin):**  
  - `GET/POST /api/admin/app-builder/ops-memory` — context, experiences, standing notes  
  - `GET/POST /api/admin/app-builder/research` — ensure vertical research exists  

Rules:

1. If a vertical has **no research**, run research agent **before** designing/building and **persist** the pack.  
2. After shipping or owner feedback, **log experience** (do not leave learnings only in chat).  
3. Production facts go in **standing notes / productionSafe experiences** — they outlive product code moves and deploys.  
4. Never store API keys in ops memory.
<!-- END:app-builder-agents-ops-memory -->

<!-- BEGIN:claude-seo-session-2026-07-09 -->
## Note from Claude (overnight SEO check, 2026-07-09)

Left untouched on purpose — flagging for whichever agent (Grok or Claude) picks this up next, please don't silently revert:

- **Prod vs. repo drift**: the live site (verlinlabs.com) still shows the old personal LinkedIn URL (`linkedin.com/in/verlin-labs-05678141b`) in the footer on at least `/mental-models`, and the "Mental Models Hub" hero image still serves at `w=3840`. Neither string was found in the current `src/` — meaning the repo already has fixes for these, but the last Vercel deployment predates them. This likely just needs a redeploy of the current `main`, not a code change. Left the deploy itself for the site owner to trigger/confirm (production release, wanted explicit go-ahead).
- **GSC / GBP status (as of tonight)**: verlinlabs.com property is verified in Search Console (account: amanmunjal.jaipur@gmail.com) but still shows "processing" for indexing and 0 clicks — property is only ~2 days old, this is expected, not a bug. Google Business Profile listing for "Verlin Labs" (India) exists under snehashodhan@gmail.com but is still "Verification required" — needs the owner to complete phone/postcard verification personally.
- **Working tree "modified" files**: git showed ~70 files as modified, but it's line-ending noise only (`git diff --ignore-all-space` is empty) — not in-flight content changes. Safe to disregard/normalize line endings if that's ever cleaned up.
- **Did not touch**: admin bugs (ToS re-consent modal loop, bare `/admin` 404, chatbot "not trained" flag) — deprioritized tonight in favor of basic SEO checks per owner's request. Still open.
- **LinkedIn Company Page**: the browser session used tonight only *follows* the Verlin Labs page, it isn't an admin on it — couldn't publish/schedule the queued posts (#4–14 in `linkedin-content/verlin-labs-linkedin-calendar.md`). Needs the actual page-admin LinkedIn login.
<!-- END:claude-seo-session-2026-07-09 -->
