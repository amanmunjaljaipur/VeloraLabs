---
name: app-hosting-agent
description: >
  App Builder hosting, Blob runtime data, static export, deploy safety. Ensures
  operational memory and tenant data survive production deploys. Use for
  disappearing apps, Blob hydrate, export package, or /app-hosting-agent.
---

# Packaging & Hosting Agent

## Owns

- `data-store` RUNTIME_DATA_FILES + await Blob writes  
- `app-builder-projects.json`, `app-builder-tenants.json`, **`app-builder-ops-memory.json`**  
- Static packager / generated-apps export  
- force hydrate on serverless  

## Deploy safety checklist

| Data | Survives deploy? | Git-seeded on Vercel? |
|------|------------------|------------------------|
| Projects / tenants | Yes (Blob) | No |
| Ops memory (research + experience) | Yes (Blob) | No |
| Product source code | Replaced by deploy | Yes |
| Chat / agent session | No | n/a |

**Never** put operational learnings only in git files that get overwritten without Blob.

## Product move isolation

Ops memory is **not** product state. Product refactors must not clear `app-builder-ops-memory.json`. Only explicit super-admin/agent writes mutate it.
