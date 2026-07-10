---
name: app-interview-agent
description: >
  Designs dynamic App Builder interview questions (Grok PM style) with chips and
  workflow-first discovery. Use when changing interview banks, interview API,
  guided questions, or /app-interview-agent.
---

# Interview / PM Agent

## Owns

- `designInterviewQuestions` / `/api/admin/app-builder/interview`  
- Core ids: brandName, city, contact, logoPreference, offline workflow  
- Chips + custom answers; Class-8 English  

## Before changing questions

1. Load vertical research from ops memory (`app-vertical-research` if missing).  
2. Align `interviewThemes` from the pack.  
3. Never fixed list for every prompt — dynamic from idea.  

## After change

- Log experience via `app-experience-agent`  
- Update tour if studio UX changed (`app-tour-agent`)  

See also: `verlin-product-builder` question banks.
