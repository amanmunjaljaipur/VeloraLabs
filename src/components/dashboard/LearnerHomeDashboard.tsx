import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VideoProgressBar } from "@/components/ui/VideoProgressBar";
import type { LearnerDashboardData } from "@/lib/learner-dashboard";
import { ROLE_LABELS } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { BookOpen, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { audienceTrackImageAlt } from "@/lib/image-alt";
import Image from "next/image";
import Link from "next/link";

const audienceImages = {
  students: "/images/students.jpg",
  engineers: "/images/engineers.jpg",
  professionals: "/images/professionals.jpg",
} as const;

interface LearnerHomeDashboardProps {
  userName: string | null | undefined;
  role: UserRole;
  data: LearnerDashboardData;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-teal transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-foreground">{percent}%</span>
        <span className="text-xs text-text-secondary">complete</span>
      </div>
    </div>
  );
}

export function LearnerHomeDashboard({ userName, role, data }: LearnerHomeDashboardProps) {
  const firstName = userName?.split(" ")[0] ?? "Learner";

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-muted/20">
        <div className="absolute inset-0">
          <Image
            src={audienceImages[data.audience]}
            alt={audienceTrackImageAlt(data.audience)}
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-teal">
                {ROLE_LABELS[role]} · Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-3 text-lg text-text-secondary">{data.course.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{data.course.duration}</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
                {data.course.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {data.nextDay ? (
                  <Link href={`/sessions/${data.nextDay.sessionId}`}>
                    <Button size="lg">
                      <PlayCircle className="h-5 w-5" />
                      Continue Day {data.nextDay.day}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/my-course">
                    <Button size="lg">
                      <CheckCircle2 className="h-5 w-5" />
                      My Course
                    </Button>
                  </Link>
                )}
                <Link href="/my-course">
                  <Button size="lg" variant="secondary">
                    <BookOpen className="h-5 w-5" />
                    View syllabus
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="w-full max-w-sm border-teal/20 bg-card/90 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <ProgressRing percent={data.overallPercent} />
                <div>
                  <p className="text-sm font-medium text-text-secondary">Overall progress</p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">
                    {data.completedDays}
                    <span className="text-lg font-normal text-text-secondary"> / {data.totalDays} days</span>
                  </p>
                  {data.nextDay ? (
                    <p className="mt-3 text-sm text-text-secondary">
                      Up next: <span className="font-medium text-foreground">Day {data.nextDay.day}</span>
                    </p>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-teal">Course completed</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold text-foreground">Module progress</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Track completion across each phase of your program.
          </p>

          <div className="mt-8 space-y-6">
            {data.modules.map((module) => (
              <Card key={module.title} className="overflow-hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {module.completedDays} of {module.totalDays} days completed
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-semibold text-teal">{module.percent}%</span>
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-700"
                    style={{ width: `${module.percent}%` }}
                  />
                </div>

                <ul className="mt-6 divide-y divide-border">
                  {module.days.map((day) => (
                    <li key={day.day}>
                      <Link
                        href={`/sessions/${day.sessionId}`}
                        className="flex items-start gap-3 py-4 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-xl"
                      >
                        {day.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary/50" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            Day {day.day}: {day.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">
                            {day.description}
                          </p>
                          {day.hasVideo && (
                            <div className="mt-2 max-w-xs">
                              <VideoProgressBar percent={day.videoPercent} />
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-teal">
                          {day.hasVideo && day.videoPercent > 0 && day.videoPercent < 100
                            ? "Resume"
                            : day.completed
                              ? "Review"
                              : "Start"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}