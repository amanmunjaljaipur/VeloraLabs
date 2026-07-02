"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import type { AudienceSlug } from "@/lib/content";
import { Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SessionRow {
  id: string;
  audience: AudienceSlug;
  day: number;
  title: string;
  phaseTitle: string;
  hasVideo: boolean;
}

const audienceOptions = [
  { value: "", label: "All tracks" },
  { value: "students", label: "Students" },
  { value: "engineers", label: "Engineers" },
  { value: "professionals", label: "Professionals" },
];

const audienceLabels: Record<AudienceSlug, string> = {
  students: "Students",
  engineers: "Engineers",
  professionals: "Professionals",
};

export function SessionVideosPanel() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState("");
  const [search, setSearch] = useState("");

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/session-videos");
    if (!res.ok) {
      toast("Failed to load sessions", "error");
      return;
    }
    const data = (await res.json()) as { sessions: SessionRow[] };
    setSessions(data.sessions);
  }, [toast]);

  useEffect(() => {
    fetchSessions().finally(() => setLoading(false));
  }, [fetchSessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchesAudience = !audience || s.audience === audience;
      const matchesSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.phaseTitle.toLowerCase().includes(search.toLowerCase()) ||
        `day ${s.day}`.includes(search.toLowerCase());
      return matchesAudience && matchesSearch;
    });
  }, [sessions, audience, search]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">Search sessions</label>
          <input
            type="search"
            placeholder="Search by title, phase, or day..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Track"
            options={audienceOptions}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((session) => (
            <li key={session.id}>
              <Link href={`/sessions/${session.id}`}>
                <Card hover className="flex items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{audienceLabels[session.audience]}</Badge>
                      <span className="text-xs font-medium text-text-secondary">
                        Day {session.day}
                      </span>
                      {session.hasVideo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
                          <Video className="h-3.5 w-3.5" />
                          Video added
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                          <VideoOff className="h-3.5 w-3.5" />
                          No video
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold text-foreground truncate">{session.title}</p>
                    <p className="text-sm text-text-secondary truncate">{session.phaseTitle}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-teal">Open →</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}