# How Verlin Labs was built (thought process)

This is the **product judgment** behind Verlin Labs. App Builder reuses the same judgment for every generated app.

## 1. Clarity before features

Verlin Labs does not start with “AI platform.” It starts with:

- Who learns? (school students, engineers, PMs)  
- What pain? (tools without understanding)  
- What offer? (free session → structured tracks)  
- What must be true for trust? (live sessions, mental models, clear legal, roles)

**App Builder equivalent:** one extension vertical, one primary owner job, one visitor job.

## 2. Audience-shaped IA

Public site is organized by **audience journeys** (`/ai-for-students`, courses, free-session), not by internal team structure.

**App Builder equivalent:** public menus are visitor jobs (Shop, Book, Contact)—not “Modules” or “Resources” unless the visitor needs them.

## 3. Operator surface is separate

Admins get CMS, CRM, roles, blog, newsletter, chatbot training—powerful but **behind** `/admin` and role gates.

**App Builder equivalent:** each app has **its own** admin under `/apps/{slug}/admin` with only relevant capabilities. Never dump full Verlin admin into a shop.

## 4. Opinionated stack, few choices

Next.js, Vercel, Blob runtime data, NextAuth for platform, structured content. Students and small businesses don’t pick databases.

**App Builder equivalent:** fixed runtime (`/apps/[slug]`), fixed packaging, fixed auth cookie model per tenant.

## 5. Runtime data survives deploys

Critical JSON lives in Blob; cold serverless instances must **re-hydrate**, not seed empty files.

**App Builder equivalent:** `app-builder-projects.json`, `app-builder-tenants.json` with force hydrate + awaited writes.

## 6. Teach judgment, don’t sell magic

Programs emphasize mental models and “map vs territory.” Vision docs admit what is *not* automated.

**App Builder equivalent:** guided interview > one magic prompt; template fallback if LLM fails; explicit “still human” steps for Maps/domain.

## 7. India-first practical channels

WhatsApp, phone, UPI, local city identity matter more than Stripe-first global SaaS.

**App Builder equivalent:** order methods chips, WhatsApp CTAs, location palettes (Jaipur pink stone, etc.).

## 8. Roles that match reality

Platform: super_admin / admin / learner roles.  
Generated apps: Owner / Manager / Staff / **mass default** (Customer).

Platform super_admin can enter any generated app as Owner (bridge). Creator is Owner. Public sign-up never becomes Owner by default.

## 9. SEO as defaults + local distribution

Technical SEO is platform work. Local success = share link + Google Business later—not Google Cloud Console for shop owners.

## 10. Phase discipline

1. Make one thing reliable (education site / ecom-local-shop).  
2. Tighten from real use.  
3. Only then widen verticals or commercialize.

---

## Mental models used in decisions

| Model | Application |
|-------|-------------|
| Map vs territory | Interview answers are the map; live shop is the territory—regenerate carefully |
| Constraints create quality | One extension shape beats infinite codegen |
| Feedback loops | Orders, inquiries, role edits close the loop for owners |
| Least privilege | Default Customer; staff invited intentionally |
| Progressive disclosure | Advanced AI model fields hidden |

## What “done” meant for Verlin

- A parent can book a free session.  
- A learner with a role can access their track.  
- An admin can operate content and CRM without engineering.  
- Deploys don’t wipe runtime data.  
- Public pages stay clear and SEO-sensible.

## What “done” means for a generated app

- Owner claims login and opens Dashboard without seeing Verlin chrome.  
- Visitor browses offer and can contact/order.  
- Staff can process day-to-day work.  
- Data still there after refresh and navigation.  
- Optional download folder for external hosting.
