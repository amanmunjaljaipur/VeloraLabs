import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  MessageSquareQuote,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Workflow,
  XCircle,
} from "lucide-react";

const WEAKNESSES_FIXED = [
  {
    was: "“Build anything as detailed as Verlin Labs”",
    now: "One vertical first: education / training / content products on a fixed modern stack (the Verlin Labs pattern family).",
  },
  {
    was: "One prompt alone = magic claims",
    now: "One prompt starts discovery. A short structured interview forces audience, offer, pages, admin needs, and success metrics.",
  },
  {
    was: "Deployment is “fully automatic”",
    now: "Automated scaffold + checklist. Human steps (DNS, OAuth, email domain, secrets) are explicit—not hidden.",
  },
  {
    was: "Generic AI app builders already exist",
    now: "Differentiation = PM process + teachable architecture + production patterns from a live product, not raw codegen speed.",
  },
  {
    was: "Insecure student apps & support chaos",
    now: "Lab mode defaults, opinionated auth/content patterns, and “what you must still verify” gates before portfolio publish.",
  },
  {
    was: "Commercial too early",
    now: "Student cohorts first → templates refined → commercial only for the same vertical when reliability is proven.",
  },
];

const STEPS = [
  {
    title: "One-line idea",
    body: "Student or PM types a single product prompt—no PRD required yet.",
    icon: Sparkles,
  },
  {
    title: "Guided interview",
    body: "8–12 fixed questions: who it’s for, what success looks like, pages, content types, auth, admin, brand, constraints.",
    icon: MessageSquareQuote,
  },
  {
    title: "Product brief (PM artifact)",
    body: "Outputs a clarity-first brief: problem, users, scope, non-goals, sitemap, journeys—judgment over vibes.",
    icon: Target,
  },
  {
    title: "Opinionated scaffold",
    body: "Generates a bounded app: marketing site, CMS-style content, blog/FAQ patterns, admin shell—not infinite architectures.",
    icon: Layers,
  },
  {
    title: "Deploy path",
    body: "Vercel-oriented defaults, env checklist, cron/content notes, and a manual steps list you can actually complete.",
    icon: Rocket,
  },
  {
    title: "Explain mode",
    body: "Every major choice maps to a mental model—map vs territory, constraints, feedback loops—so students learn why, not only what.",
    icon: Compass,
  },
];

const OUTPUTS = [
  "Product brief students can defend in a review",
  "Sitemap + primary user journeys",
  "Content / data model for pages and posts",
  "Scaffold aligned to Verlin Labs production patterns",
  "Deploy checklist (Vercel, env, auth redirects, email domain)",
  "Explicit “still human” list—so nothing is fake-automated",
];

const NOT_THIS = [
  "Not a promise to rebuild every subsystem of Verlin Labs on demand",
  "Not unlimited stack choice (opinionated by design)",
  "Not zero-touch DNS, OAuth, or email verification",
  "Not a replacement for engineering judgment or code review",
  "Not “general purpose enterprise software” on day one",
];

const MODES = [
  {
    title: "Lab mode",
    body: "Safe sandbox for courses—local or limited deploy, no production payments/email required.",
  },
  {
    title: "Portfolio mode",
    body: "Ship a public training-institute style site with checklist-gated go-live.",
  },
  {
    title: "Explain mode",
    body: "Every step annotated with clarity-first reasoning for assessments and demos.",
  },
];

const PHASES = [
  {
    phase: "Phase 1 — Students",
    items: [
      "Cohorts use App Builder Lab inside Verlin Labs programs",
      "One template family: clarity-first training institute website",
      "Capstone: brief + deployed portfolio site + oral defense",
    ],
  },
  {
    phase: "Phase 2 — Reliability",
    items: [
      "Tighten questions, templates, and guardrails from cohort feedback",
      "Measure: time-to-brief, deploy success, student clarity scores",
      "Still education-first—not open commercial chaos",
    ],
  },
  {
    phase: "Phase 3 — Commercial (later)",
    items: [
      "Same vertical only: education / cohort / content businesses",
      "Paid seats after student-proven quality bar",
      "Never lead with “build anything”—lead with scope and outcomes",
    ],
  },
];

/** Admin-only product vision for App Builder Lab */
export function AppBuilderVision() {
  return (
    <div className="space-y-10 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-teal">
          Admin only · Product vision
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">App Builder Lab</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
          One idea → guided questions → product brief, opinionated scaffold, and an honest deploy
          path. Built to train judgment—then scale only when quality is proven. Not public.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">The 10/10 idea</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
          Not “magic codegen.” A PM operating system that ships a bounded product.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
          Students and product managers type a single prompt. The lab interviews them hard, forces
          scope, and produces a real brief plus a fixed modern stack scaffold—patterned after how
          Verlin Labs actually runs in production. Commercial access comes later, for the same
          vertical only, after student cohorts prove reliability.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Weaknesses fixed</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {WEAKNESSES_FIXED.map((row) => (
            <Card key={row.was} className="p-5">
              <p className="flex items-start gap-2 text-sm text-text-secondary">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500/80" aria-hidden />
                <span>
                  <span className="font-medium text-foreground/80">Was: </span>
                  {row.was}
                </span>
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                <span>
                  <span className="font-medium text-teal">Now: </span>
                  {row.now}
                </span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 text-sm font-bold text-teal">
                  {i + 1}
                </span>
                <Icon className="mt-4 h-5 w-5 text-accent-teal" aria-hidden />
                <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-teal">
            <Workflow className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">What you get</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {OUTPUTS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-text-secondary">
            <Shield className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">What this is not</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {NOT_THIS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Three modes for training</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODES.map((mode) => (
            <Card key={mode.title} className="p-5">
              <h3 className="font-semibold text-foreground">{mode.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{mode.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#0a1628] p-6 text-white md:p-8">
        <GraduationCap className="h-7 w-7 text-teal-300" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold tracking-tight">Why this lives on Verlin Labs</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
          Verlin Labs is a running production system: Site CMS, design studio, chatbot training,
          blog scheduler, newsletter cron, auth, SEO, and deploy discipline. App Builder Lab teaches
          students to productize those patterns—not invent random stacks in a vacuum.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Path to 10/10 execution</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Build at any cost—with discipline. Students first. Commercial only when quality is
          boringly reliable.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PHASES.map((block) => (
            <Card key={block.phase} className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-teal">
                {block.phase}
              </h3>
              <ul className="mt-3 space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
