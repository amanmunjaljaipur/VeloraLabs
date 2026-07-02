import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { VideoProgressBar } from "@/components/ui/VideoProgressBar";
import type { AudienceSlug, CoursePhase } from "@/lib/content";
import { buildSessionId } from "@/lib/session-videos";
import { PlayCircle, Video } from "lucide-react";
import Link from "next/link";

interface CourseCurriculumProps {
  phases: CoursePhase[];
  audience: AudienceSlug;
  sessionVideoIds?: string[];
  videoProgressMap?: Record<string, number>;
  completedDays?: number[];
}

export function CourseCurriculum({
  phases,
  audience,
  sessionVideoIds = [],
  videoProgressMap = {},
  completedDays = [],
}: CourseCurriculumProps) {
  const videoSet = new Set(sessionVideoIds);
  const completedSet = new Set(completedDays);

  return (
    <div className="space-y-16">
      {phases.map((phase) => (
        <div key={phase.title}>
          <h2 className="text-2xl font-semibold mb-8 text-teal">{phase.title}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {phase.days.map((day) => {
              const sessionId = buildSessionId(audience, day.day);
              const hasVideo = videoSet.has(sessionId);
              const isCompleted = completedSet.has(day.day);
              const videoPercent = isCompleted ? 100 : (videoProgressMap[sessionId] ?? 0);

              return (
                <Link key={day.day} href={`/sessions/${sessionId}`} className="block h-full group">
                  <Card hover className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal text-sm font-semibold">
                          {day.day}
                        </span>
                        <h3 className="font-semibold text-foreground group-hover:text-teal transition-colors">
                          {day.title}
                        </h3>
                      </div>
                      {hasVideo ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
                          <Video className="h-3.5 w-3.5" />
                          Recording
                        </span>
                      ) : (
                        <PlayCircle className="h-5 w-5 shrink-0 text-text-secondary/50 group-hover:text-teal transition-colors" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4">{day.description}</p>
                    {hasVideo && (
                      <VideoProgressBar percent={videoPercent} className="mb-4" />
                    )}
                    <div className="mt-auto">
                      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
                        {day.activities ? "Activities" : "Topics"}
                      </p>
                      <ul className="space-y-1.5">
                        {(day.topics || day.activities || []).map((item) => (
                          <li key={item} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-teal mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {day.assignment && (
                        <Badge className="mt-4 bg-teal/10 text-teal border-0">
                          Assignment: {day.assignment}
                        </Badge>
                      )}
                      <p className="mt-4 text-xs font-medium text-teal opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasVideo
                          ? isCompleted
                            ? "Review session →"
                            : videoPercent > 0 && videoPercent < 100
                              ? "Resume session →"
                              : "Watch session →"
                          : "Open session →"}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}