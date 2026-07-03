"use client";

import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { AudienceSlug } from "@/lib/content";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  Code,
  GraduationCap,
  LayoutGrid,
  Search,
  Video,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface SessionRow {
  id: string;
  audience: AudienceSlug;
  day: number;
  title: string;
  description: string;
  phaseTitle: string;
  hasVideo: boolean;
}

interface ProgramPhase {
  title: string;
  sessions: SessionRow[];
}

interface ProgramGroup {
  slug: AudienceSlug;
  title: string;
  description: string;
  duration: string;
  videoCount: number;
  totalSessions: number;
  phases: ProgramPhase[];
}

const programIcons: Record<AudienceSlug, LucideIcon> = {
  students: GraduationCap,
  engineers: Code,
  professionals: Briefcase,
};

const programLabels: Record<AudienceSlug, string> = {
  students: "School Students (Classes 6–12)",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

type ProgramFilter = "all" | AudienceSlug;

export function SessionVideosPanel() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);
  const [totals, setTotals] = useState({ videoCount: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<ProgramFilter>("all");
  const [search, setSearch] = useState("");

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/session-videos");
    if (!res.ok) {
      toast("Failed to load sessions", "error");
      return;
    }
    const data = (await res.json()) as {
      programs: ProgramGroup[];
      totals: { videoCount: number; totalSessions: number };
    };
    setPrograms(data.programs);
    setTotals(data.totals);
  }, [toast]);

  useEffect(() => {
    fetchSessions().finally(() => setLoading(false));
  }, [fetchSessions]);

  const visiblePrograms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return programs
      .filter((program) => activeProgram === "all" || program.slug === activeProgram)
      .map((program) => {
        const phases = program.phases
          .map((phase) => ({
            ...phase,
            sessions: phase.sessions.filter((session) => {
              if (!query) return true;
              return (
                session.title.toLowerCase().includes(query) ||
                session.description.toLowerCase().includes(query) ||
                phase.title.toLowerCase().includes(query) ||
                `day ${session.day}`.includes(query)
              );
            }),
          }))
          .filter((phase) => phase.sessions.length > 0);

        return { ...program, phases };
      })
      .filter((program) => program.phases.length > 0);
  }, [programs, activeProgram, search]);

  const overallPercent =
    totals.totalSessions > 0
      ? Math.round((totals.videoCount / totals.totalSessions) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 md:px-8">
      <Card className="border-teal/20 bg-teal/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal">Upload progress</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {totals.videoCount}
              <span className="text-lg font-normal text-text-secondary">
                {" "}
                / {totals.totalSessions} session recordings
              </span>
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Overall completion</span>
              <span className="font-medium text-teal">{overallPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveProgram("all")}
          className={cn(
            "rounded-2xl border p-4 text-left transition-all",
            activeProgram === "all"
              ? "border-teal bg-teal/5 shadow-sm"
              : "border-border bg-card hover:border-teal/30"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">All programs</p>
          <p className="mt-1 text-xs text-text-secondary">
            {totals.videoCount} of {totals.totalSessions} uploaded
          </p>
        </button>

        {programs.map((program) => {
          const Icon = programIcons[program.slug];
          const percent =
            program.totalSessions > 0
              ? Math.round((program.videoCount / program.totalSessions) * 100)
              : 0;

          return (
            <button
              key={program.slug}
              type="button"
              onClick={() => setActiveProgram(program.slug)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                activeProgram === program.slug
                  ? "border-teal bg-teal/5 shadow-sm"
                  : "border-border bg-card hover:border-teal/30"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-teal">
                {programLabels[program.slug]}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                {program.title}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                {program.videoCount}/{program.totalSessions} videos · {percent}%
              </p>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="search"
          placeholder="Search by lesson, module, or day..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : visiblePrograms.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary">No sessions match your search.</p>
        </Card>
      ) : (
        <div className="space-y-14">
          {visiblePrograms.map((program) => {
            const Icon = programIcons[program.slug];
            const percent =
              program.totalSessions > 0
                ? Math.round((program.videoCount / program.totalSessions) * 100)
                : 0;

            return (
              <section key={program.slug} className="space-y-8">
                <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-teal">
                        {programLabels[program.slug]}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">
                        {program.title}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                        {program.description}
                      </p>
                      <p className="mt-2 text-xs text-text-secondary">
                        {program.duration} · {program.videoCount} of {program.totalSessions}{" "}
                        recordings uploaded ({percent}%)
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/courses/${program.slug}#curriculum`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline shrink-0"
                  >
                    View program syllabus
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {program.phases.map((phase) => (
                  <div key={phase.title}>
                    <h3 className="mb-4 text-lg font-semibold text-teal">{phase.title}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {phase.sessions.map((session) => (
                        <Link key={session.id} href={`/sessions/${session.id}`} className="group block h-full">
                          <Card
                            hover
                            className={cn(
                              "flex h-full flex-col",
                              session.hasVideo ? "border-teal/15" : "border-dashed"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-sm font-semibold text-teal">
                                  {session.day}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-foreground group-hover:text-teal transition-colors line-clamp-1">
                                    {session.title}
                                  </h4>
                                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                                    Day {session.day}
                                  </p>
                                </div>
                              </div>
                              {session.hasVideo ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
                                  <Video className="h-3.5 w-3.5" />
                                  Uploaded
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-text-secondary">
                                  <VideoOff className="h-3.5 w-3.5" />
                                  Missing
                                </span>
                              )}
                            </div>
                            <p className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed line-clamp-2">
                              {session.description}
                            </p>
                            <p className="mt-4 text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                              {session.hasVideo ? "Edit recording →" : "Add recording →"}
                            </p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}