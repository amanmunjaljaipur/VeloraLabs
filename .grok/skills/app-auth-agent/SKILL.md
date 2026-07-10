---
name: app-auth-agent
description: >
  Per-app auth, tenant roles, cookies path=/, Google login for shops, platform
  super_admin bridge. Use for login bugs, roles, owner claim, or /app-auth-agent.
---

# Auth & Tenancy Agent

## Owns

- App session cookie path `/`  
- Tenant roles / members / capabilities  
- Owner = creator + platform super_admin bridge  
- Default public role = customer (mass role)  
- Separate from Verlin Labs platform login  

## Rules

- Never default new public sign-ups to Owner  
- Await Blob on tenant writes  
- Log auth incidents to ops memory as production standing notes when relevant  
