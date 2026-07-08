import { auth } from "@/auth";
import { SessionResourcesAdmin } from "@/components/sessions/SessionResourcesAdmin";
import { SessionVideoComments } from "@/components/sessions/SessionVideoComments";
import { SessionVideoPlayer } from "@/components/sessions/SessionVideoPlayer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isDayCompleted } from "@/lib/course-progress";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getSessionDocuments } from "@/lib/session-documents";
import { canAccessSession } from "@/lib/session-access-grants";
import { isAdminRole } from "@/lib/session-access";
import { getSessionMeta, getSessionVideo } from "@/lib/session-videos";
import { getVideoProgress } from "@/lib/video-progress";
import { ExternalLink, FileText, Lock, Video } from "lucide-react";
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
  const documents = getSessionDocuments(sessionId, { learnersOnly: !isAdmin });

  if (!authSession?.user) {
    redirect(`/login?callbackUrl=/sessions/${sessionId}`);
  }

  const hasAccess = canAccessSession(
    authSession.user.email,
    authSession.user.role,
    sessionId
  );
  const videoProgress =
    hasAccess && authSession.user.email
      ? getVideoProgress(authSession.user.email, sessionId)
      : null;
  const reviewMode =
    hasAccess && authSession.user.email
      ? isDayCompleted(authSession.user.email, meta.day)
      : false;
  const isEnrolled = isEnrolledLearner(authSession.user.email, authSession.user.role);
  const courseBackHref = isEnrolled ? "/my-course" : `/courses/${meta.audience}#curriculum`;
  const courseBackLabel = isEnrolled ? "My Course" : `${audienceLabels[meta.audience]} course`;
  const adminDocuments = isAdmin ? getSessionDocuments(sessionId) : documents;

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
          <SessionResourcesAdmin
            sessionId={sessionId}
            initialVideoUrl={video?.youtubeUrl ?? ""}
            videoId={video?.youtubeId}
            initialDocuments={adminDocuments}
            title={meta.title}
          />
        )}

        {!isAdmin && !hasAccess && (
          <Card className="text-center py-12">
            <Lock className="mx-auto h-10 w-10 text-text-secondary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Access restricted</h2>
            <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
              This lesson is only available to learners who have been granted access to this module.
              Contact your instructor if you believe you should have access.
            </p>
          </Card>
        )}

        {!isAdmin && hasAccess && documents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-semibold text-foreground">Training documents</h2>
            </div>
            {documents.map((document) => (
              <Card key={document.id} className="border-teal/15 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <a
                        href={document.learnerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-teal hover:underline"
                      >
                        {document.title}
                      </a>
                      <p className="mt-1 text-sm text-text-secondary capitalize">{document.type}</p>
                      {document.summary && (
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {document.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={document.learnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 transition-colors shrink-0"
                  >
                    Open document
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isAdmin && hasAccess && video && (
          <div className="space-y-10">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-teal" />
                <h2 className="text-lg font-semibold text-foreground">Training video</h2>
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
            <SessionVideoComments sessionId={sessionId} />
          </div>
        )}

        {isAdmin && video && <SessionVideoComments sessionId={sessionId} />}

        {!isAdmin && hasAccess && !video && documents.length === 0 && (
          <Card className="text-center py-12">
            <Video className="mx-auto h-10 w-10 text-text-secondary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Content coming soon</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Your instructor hasn&apos;t uploaded the training video or document for this lesson yet.
            </p>
          </Card>
        )}

        {!isAdmin && hasAccess && !video && documents.length > 0 && (
          <Card className="text-center py-8">
            <p className="text-sm text-text-secondary">
              The training video for this lesson hasn&apos;t been uploaded yet. You can still use the
              training documents above.
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