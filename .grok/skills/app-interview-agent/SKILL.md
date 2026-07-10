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
- `vertical-interview-cores.ts` — **per-vertical chips** (bank ≠ shop ≠ resume)  
- Core ids: brandName, whoFor, mainJob, contact, logoPreference  
- Offline shop workflow **only** for ecom  
- Chips + custom answers; Class-8 English  

## Hard rules

1. Detect vertical from the prompt **before** designing questions.  
2. `whoFor` chips must match the product:  
   - Banking → retail / salary / SME / NRI / premium — **never** Students / Parents / Job seekers  
   - Insurance → families / group / seniors  
   - Shop → neighbours / gift buyers / WhatsApp  
3. After LLM design, run `retargetQuestionsForVertical` so shop chips cannot leak.  
4. Every question is skippable.  

## Before changing questions

1. Load vertical research from ops memory (`app-vertical-research` if missing).  
2. Align `interviewThemes` from the pack.  
3. Never one fixed chip list for every prompt.  

## After change

- Log experience via `app-experience-agent`  
- Update tour if studio UX changed (`app-tour-agent`)  

See also: `verlin-product-builder` question banks.
