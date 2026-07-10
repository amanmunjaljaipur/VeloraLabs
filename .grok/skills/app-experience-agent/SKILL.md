---
name: app-experience-agent
description: >
  Captures learnings from builders, owners, and production into deploy-safe
  operational memory so agents improve over time. Use after shipping App Builder
  changes, owner feedback, bugs, or /app-experience-agent, "log learning".
---

# Experience Learner Agent

## Why

Chat and product deploys forget. **Ops memory does not.**  
Every meaningful App Builder change should leave a footprint in Blob-backed memory.

## Write APIs

`POST /api/admin/app-builder/ops-memory`

| action | Body |
|--------|------|
| `experience` | agent, kind, summary, detail?, verticalId?, tags?, productionSafe? |
| `standing_note` | note, tags? — production facts that must not die with deploys |
| `known_gap` | gap, severity? |
| `preference` | key, value — durable agent preferences |

## Kinds

`bugfix` · `feature` · `owner_feedback` · `research` · `deploy_note` · `process` · `seo` · `theme` · `other`

## Rules

1. `productionSafe: true` by default for live-site facts.  
2. Standing notes for: env quirks, owner preferences, “do not silently revert X”.  
3. After research, feature, or bugfix — log once.  
4. Never store secrets (API keys) in ops memory.  

## Code

`logExperience`, `addProductionStandingNote`, `addKnownGap`, `setAgentPreference` in `ops-memory.ts`.
