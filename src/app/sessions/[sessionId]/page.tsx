import { auth } from "@/auth";
import { SessionVideoAdmin } from "@/components/sessions/SessionVideoAdmin";
import { SessionVideoPlayer } from "@/components/sessions/SessionVideoPlayer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isDayCompleted } from "@/lib/course-progress";
import { isEnrolledLearner } from "@/lib/enrollment";
import { canAccessSessionVideo, isAdminRole } from "@/lib/session-access";
import { getSessionMeta, getSessionVideo } from "@/lib/session-videos";
import { getVideoProgress } from "@/lib/video-progress";
import { Lock, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const audienceLabels = {
  students: "School Students",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) return { title: "Session Not Found" };
  return {
    title: `Day ${meta.day}: ${meta.title}`,
    description: meta.description,
  };
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) notFound();

  const authSession = await auth();
  const video = getSessionVideo(sessionId);
  const isAdmin = authSession?.user ? isAdminRole(authSession.user.role) : false;

  if (!authSession?.user) {
    redirect(`/login?callbackUrl=/sessions/${sessionId}`);
  }

  const hasAccess = canAccessSessionVideo(authSession.user.role, meta.audience);
  const videoProgress =
    hasAccess && authSession.user.email
      ? getVideoProgress(authSession.user.email, sessionId)
      : null;
  const reviewMode =
    hasAccess && authSession.user.email
      ? isDayCompleted(authSession.user.email, meta.day)
      : false;
  const isEnrolled = isEnrolledLearner(authSession.user.email, authSession.user.role);
  const courseBackHref = isEnrolled ? "/my-course" : `/for/${meta.audience}#curriculum`;
  const courseBackLabel = isEnrolled ? "My Course" : `${audienceLabels[meta.audience]} course`;

  return (
    <div className="pb-16 md:pb-24">
      <section className="border-b border-border bg-muted/30 py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <Link
            href={courseBackHref}
            className="text-sm font-medium text-teal hover:underline"
          >
            ← Back to {courseBackLabel}
          </Link>
          <p className="mt-4 text-sm font-medium text-teal">{meta.phaseTitle}</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-foreground">
            Day {meta.day}: {meta.title}
          </h1>
          <p className="mt-4 text-text-secondary leading-relaxed">{meta.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10 space-y-8">
        {isAdmin && (
          <SessionVideoAdmin
            sessionId={sessionId}
            initialUrl={video?.youtubeUrl ?? ""}
            videoId={video?.youtubeId}
            title={meta.title}
          />
        )}

        {!isAdmin && !hasAccess && (
          <Card className="text-center py-12">
            <Lock className="mx-auto h-10 w-10 text-text-secondary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Access restricted</h2>
            <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
              This session recording is only available to enrolled{" "}
              {audienceLabels[meta.audience].toLowerCase()} learners.
            </p>
          </Card>
        )}

        {!isAdmin && hasAccess && video && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-semibold text-foreground">Session recording</h2>
            </div>
            <SessionVideoPlayer
              sessionId={sessionId}
              videoId={video.youtubeId}
              title={meta.title}
              initialWatchedSeconds={videoProgress?.watchedSeconds}
              initialDurationSeconds={videoProgress?.durationSeconds}
              initialPercent={videoProgress?.percent}
              reviewMode={reviewMode}
            />
          </div>
        )}

        {!isAdmin && hasAccess && !video && (
          <Card className="text-center py-12">
            <Video className="mx-auto h-10 w-10 text-text-secondary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Video coming soon</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Your instructor hasn&apos;t uploaded this session recording yet. Check back later.
            </p>
          </Card>
        )}

        {!isAdmin && (
          <div className="pt-4">
            <Link href={courseBackHref}>
              <Button variant="secondary">
                {isEnrolled ? "Back to My Course" : "View full curriculum"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}