---
name: avatar-studio-design
description: >
  Design system + AI-native UX rules for Verlin Avatar Studio (and similar product
  tools). Merges shadcn/ui composition principles with Verlin brand tokens and
  existing src/components/ui — not a second design system. Use when changing
  Avatar Studio UI, freemium setup flows, job players, credits, or agentic status.
---

# Avatar Studio Design Skill

## Sources of truth (priority)

1. **This skill** for Avatar Studio product surfaces (`/avatar-studio`, admin training)
2. **Verlin tokens** in `src/app/globals.css` + `verlin-ui-polish` (navy, teal, amber, cream)
3. **Existing UI kit** in `src/components/ui/*` (do **not** invent parallel buttons/cards)
4. **shadcn composition principles** below (patterns, not a second visual brand)
5. **AI-native product design** (status, trust, recovery, evaluation loops)

> This repo has **no** `components.json` / full shadcn install. Map shadcn ideas onto Verlin components. Do **not** run `shadcn init` unless the owner explicitly asks to migrate the whole site.

---

## Component map (shadcn → Verlin)

| Need | Use |
|------|-----|
| Button | `@/components/ui/Button` — `primary` \| `secondary` \| `cta` |
| Card | `@/components/ui/Card` + `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` |
| Badge / status | `@/components/ui/Badge` — prefer `variant` + semantic class only when status map needs it |
| Input / Select | `@/components/ui/Input`, `Select` (label + error built-in) |
| Field layout | `@/components/ui/Field` — `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription` |
| Option sets (2–7) | `@/components/ui/FilterTabs` or toggle chips with `cn()` — not a loop of ad-hoc primary buttons |
| Tabs (page IA) | Top pill nav with clear labels; keep one primary task per tab |
| Alert / callout | `@/components/ui/Alert` |
| Empty | `@/components/ui/EmptyState` (or studio-specific empty with CTA) |
| Loading | `@/components/ui/Skeleton`, `SkeletonCard`, `Spinner` |
| Progress | `@/components/ui/Progress` |
| Separator | `@/components/ui/Separator` |
| Toast | `@/components/ui/Toast` → `useToast()` (project toast, not sonner unless installed) |
| Modal | `@/components/ui/Modal` — always has a title |
| Icons | `lucide-react` — size via parent; in buttons use gap + icon sibling (Button already `gap-2`) |
| `cn()` | `@/lib/utils` |

---

## Critical styling rules (always)

1. **Layout with `className`, not restyle components.** Prefer variants over `bg-blue-500`.
2. **No `space-y-*` / `space-x-*`.** Use `flex flex-col gap-*` or `flex gap-*`.
3. **Equal sides → `size-*`.** `size-10` not `h-10 w-10` when equal.
4. **Semantic colors.** `bg-card`, `text-foreground`, `text-text-secondary`, `border-border`, `bg-muted`, `text-accent-teal` / brand navy. Avoid raw `bg-emerald-600` except badge status maps already in kit.
5. **`cn()` for conditionals.** No long template-literal class ternaries when `cn()` is clearer.
6. **Touch targets.** Buttons already ≥44px on `md`; don’t shrink primary actions below `sm`.
7. **Motion.** 150–220ms ease-out; respect `prefers-reduced-motion` (Button/Card already do).

---

## Forms

- Group fields with `FieldGroup` (`flex flex-col gap-4`).
- Prefer `Input`/`Select` with `label` + `error` props.
- Validation: `error` prop or `aria-invalid` on control; short helper text under field.
- Option sets (script source, free vs custom, short vs long): **FilterTabs** or pill toggles, not competing primary buttons.

---

## Composition (product pages)

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Step 1 — Script</CardTitle>
    <CardDescription>Generate or paste. Review before render.</CardDescription>
  </CardHeader>
  <CardContent className="flex flex-col gap-4">…</CardContent>
  <CardFooter className="flex justify-between gap-2">…</CardFooter>
</Card>
```

### Status

- Job status → `Badge` + short human label (“Creating voice…”, “Ready”).
- Don’t use green/red raw text alone; pair with Badge + `Alert` for failures.

### Empty / loading / error (every list)

| State | Pattern |
|-------|---------|
| Loading | `Skeleton` / `SkeletonCard` / page `Spinner` |
| Empty | `EmptyState` + single CTA (“Create your first video”) |
| Error | `Alert` variant destructive + recoverable action |
| In progress | `Progress` + status Badge + Cancel |

---

## Avatar Studio IA (do not regress)

| Tab | Purpose | Success |
|-----|---------|---------|
| **Create** | Wizard: Script → Options → Generate → Watch | User finishes a job without hunting |
| **My videos** | List + in-app player | View button; play Presenter or video |
| **Credits** | Balance + freemium limits + ledger | User knows monthly free allotment |
| **Setup** | Free vs custom URLs, Drive, consent | Advanced only; free works with zero setup |

### Wizard principles (agentic UX)

1. **One primary action per step** (Generate draft → Next → Create video).
2. **Show system status** while agents run (queued → voice → avatar → ready).
3. **Trust:** freemium defaults labeled Free; paid/custom clearly optional in Setup.
4. **Recovery:** Cancel & refund; show error in `Alert`; keep script so user can retry.
5. **Evaluation loop:** thumbs / transcript edit feed training pool (don’t hide feedback).
6. **View in-app:** never force “open raw URL only” as the only way to see output.

### Freemium honesty

- Free Presenter = portrait + audio + captions (not true lip-sync).
- Custom URL = optional GPU/local host; fail open to free when possible.
- Surface limits (200 tokens / month, clip planning seconds) on Credits for everyone.

---

## AI-native product designer checklist (studio)

Use before shipping UI changes:

| # | Question | Required |
|---|----------|----------|
| 1 | 80% path (free Create → Watch) works without Setup? | Yes |
| 2 | Loading / empty / error / success states covered? | Yes |
| 3 | Agent progress visible (not a silent spinner only)? | Yes |
| 4 | User can cancel and get tokens refunded? | Yes |
| 5 | Credits / freemium limits visible without hunting? | Yes |
| 6 | Result playable in-app (Presenter + video)? | Yes |
| 7 | Consent/legal for likeness available before clone use? | Yes |
| 8 | No raw GPU jargon on the happy path? | Yes |

---

## Anti-patterns

- Dense multi-column forms on Create without steps
- Custom rainbow gradients / purple AI slop
- Hiding completed videos only behind external links
- Requiring custom endpoint URLs before first success
- `space-y-*` stacks and one-off `bg-blue-500` status chips
- Duplicating Button/Card styles inline instead of kit components

---

## When adding shadcn later

If the owner asks to install official shadcn:

1. Confirm **merge vs overwrite** for tokens (preserve Verlin cream/navy/teal).
2. Run `npx shadcn@latest` only with explicit registry/preset.
3. Map new components into `src/components/ui` without breaking marketing pages.
4. Keep this skill’s IA and freemium rules even after primitives change.

---

## File ownership

| Area | Path |
|------|------|
| Studio UI | `src/components/avatar-studio/AvatarStudioApp.tsx` |
| Design primitives | `src/components/ui/*` |
| Tokens | `src/app/globals.css` |
| Freemium copy/limits | `src/lib/avatar-studio/freemium.ts` |
| Durable JSON (deploy-safe) | Postgres via `DATABASE_URL` — `src/lib/data-store.ts`, `docs/DURABLE-STORAGE.md` |
| Media binaries | Drive if connected, else Blob — not Postgres |
| This skill | `.grok/skills/avatar-studio-design/SKILL.md` |
