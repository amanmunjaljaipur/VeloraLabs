---
name: app-vertical-research
description: >
  Researches an App Builder application vertical (ecom, booking, tuition, etc.)
  from industry leaders and local India reality, then saves to deploy-safe ops
  memory DB for reuse. Use when vertical knowledge is missing, new extension
  type, industry leaders table, or /app-vertical-research, "research this app
  type", "update research DB".
---

# Vertical Research Agent

## Mission

If we have **not researched** this application type, research **immediately** and **update the operational DB** so later agents reuse it. Never leave research only in the conversation.

## Storage

- File: `app-builder-ops-memory.json` (Blob runtime)  
- API: `POST /api/admin/app-builder/research`  
  Body: `{ "verticalId", "label?", "ideaPrompt?", "force?" }`  
- Library: `ensureVerticalResearched` in `src/lib/app-builder/vertical-research.ts`  

Pack shape: leaders, visitor/owner jobs, public pages, admin menus, interview themes, channels, payments, roles, SEO, premiumization, multi-colour notes, risks, launch checklist.

## Steps

1. Normalize `verticalId` (kebab-case).  
2. Check existing pack (`GET .../research?verticalId=`).  
3. If missing or stale + user asked refresh → run research (`force: true` only when explicit).  
4. Prefer: known starters → LLM enrich → heuristic fallback.  
5. Confirm save returned `created` / pack.  
6. Log experience (done automatically by ensureVerticalResearched).  
7. Hand pack back to orchestrator / extension-design / interview agents.

## Research quality

- India-first channels (WhatsApp, UPI) when local  
- Name real reference products + **lesson** for Verlin  
- Multi-colour theme notes always  
- Non-tech plainLabel  
- No invented regulations  

## When coding a new extension

Research **before** `types.ts` / menus. Extension-design agent consumes this pack.
