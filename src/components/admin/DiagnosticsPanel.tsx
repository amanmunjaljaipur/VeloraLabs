"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, FileWarning, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface LogPageSummary {
  page: string;
  count: number;
  errorCount: number;
  lastAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn";
  page: string;
  message: string;
  meta?: Record<string, unknown>;
  tenantId?: string | null;
}

type LevelFilter = "all" | "error" | "warn";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DiagnosticsPanel() {
  const { toast } = useToast();
  const [pages, setPages] = useState<LogPageSummary[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    setLoadingPages(true);
    try {
      const res = await fetch("/api/admin/diagnostics/logs", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { pages: LogPageSummary[] };
      setPages(data.pages);
    } catch {
      toast("Failed to load diagnostics", "error");
    } finally {
      setLoadingPages(false);
    }
  }, [toast]);

  const loadEntries = useCallback(
    async (page: string, lvl: LevelFilter) => {
      setLoadingEntries(true);
      try {
        const params = new URLSearchParams({ page });
        if (lvl !== "all") params.set("level", lvl);
        const res = await fetch(`/api/admin/diagnostics/logs?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { entries: LogEntry[] };
        setEntries(data.entries);
      } catch {
        toast("Failed to load log entries", "error");
      } finally {
        setLoadingEntries(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (selectedPage) loadEntries(selectedPage, level);
  }, [selectedPage, level, loadEntries]);

  const totalErrors = useMemo(
    () => pages.reduce((sum, p) => sum + p.errorCount, 0),
    [pages]
  );
  const totalEvents = useMemo(() => pages.reduce((sum, p) => sum + p.count, 0), [pages]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 md:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">Errors</p>
            <p className="text-xl font-semibold text-foreground">{totalErrors}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">Total events</p>
            <p className="text-xl font-semibold text-foreground">{totalEvents}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
            <FileWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">Pages affected</p>
            <p className="text-xl font-semibold text-foreground">{pages.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Pages</h2>
            <button
              type="button"
              onClick={loadPages}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loadingPages && "animate-spin")} />
            </button>
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {loadingPages ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">
                No critical events logged yet. That&apos;s a good sign.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {pages.map((p) => (
                  <li key={p.page}>
                    <button
                      type="button"
                      onClick={() => setSelectedPage(p.page)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted",
                        selectedPage === p.page && "bg-accent-teal/5"
                      )}
                    >
                      <span className="truncate text-sm font-medium text-foreground">
                        {p.page}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-text-secondary">
                        {p.errorCount > 0 && (
                          <Badge className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
                            {p.errorCount} error{p.errorCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {p.count - p.errorCount > 0 && (
                          <span>{p.count - p.errorCount} warning{p.count - p.errorCount === 1 ? "" : "s"}</span>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatWhen(p.lastAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-0">
          {!selectedPage ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
              <FileWarning className="h-8 w-8 text-text-secondary" />
              <p className="text-sm text-text-secondary">
                Pick a page on the left to see its detailed log.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="truncate text-sm font-semibold text-foreground">{selectedPage}</h2>
                <div className="flex gap-1.5">
                  {(["all", "error", "warn"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        level === lvl
                          ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                          : "border-border text-text-secondary hover:bg-muted"
                      )}
                    >
                      {lvl === "all" ? "All" : lvl === "error" ? "Errors" : "Warnings"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[32rem] overflow-y-auto">
                {loadingEntries ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-text-secondary">
                    No entries for this filter.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {entries.map((entry) => {
                      const expanded = expandedId === entry.id;
                      return (
                        <li key={entry.id} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : entry.id)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <Badge
                              className={cn(
                                "mt-0.5 shrink-0",
                                entry.level === "error"
                                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              )}
                            >
                              {entry.level}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-foreground">{entry.message}</p>
                              <p className="mt-0.5 text-xs text-text-secondary">
                                {formatWhen(entry.timestamp)}
                                {entry.tenantId ? ` - ${entry.tenantId}` : ""}
                              </p>
                              {expanded && entry.meta && (
                                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                                  {JSON.stringify(entry.meta, null, 2)}
                                </pre>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
