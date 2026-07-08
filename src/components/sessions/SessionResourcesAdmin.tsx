"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import type { SessionDocumentType } from "@/lib/session-documents";
import { FileText, Video } from "lucide-react";
import { useState } from "react";
import { YouTubeEmbed } from "./YouTubeEmbed";

interface SessionDocumentState {
  title: string;
  url: string;
  type: SessionDocumentType;
}

interface SessionResourcesAdminProps {
  sessionId: string;
  initialVideoUrl: string;
  videoId?: string;
  initialDocument?: SessionDocumentState | null;
  title: string;
}

const documentTypeOptions = [
  { value: "link", label: "Link" },
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Document" },
  { value: "slides", label: "Slides" },
];

export function SessionResourcesAdmin({
  sessionId,
  initialVideoUrl,
  videoId,
  initialDocument,
  title,
}: SessionResourcesAdminProps) {
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState(initialVideoUrl);
  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [savingVideo, setSavingVideo] = useState(false);
  const [removingVideo, setRemovingVideo] = useState(false);

  const [documentTitle, setDocumentTitle] = useState(initialDocument?.title ?? "");
  const [documentUrl, setDocumentUrl] = useState(initialDocument?.url ?? "");
  const [documentType, setDocumentType] = useState<SessionDocumentType>(
    initialDocument?.type ?? "link"
  );
  const [hasDocument, setHasDocument] = useState(Boolean(initialDocument));
  const [savingDocument, setSavingDocument] = useState(false);
  const [removingDocument, setRemovingDocument] = useState(false);

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVideo(true);

    try {
      const res = await fetch(`/api/session-videos/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl }),
      });
      const data = (await res.json()) as {
        error?: string;
        video?: { youtubeId: string };
      };

      if (!res.ok) {
        toast(data.error || "Failed to save video link", "error");
        return;
      }

      setCurrentVideoId(data.video?.youtubeId);
      toast("Training video saved", "success");
    } catch {
      toast("Failed to save video link", "error");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    setRemovingVideo(true);
    try {
      const res = await fetch(`/api/session-videos/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Failed to remove video link", "error");
        return;
      }
      setYoutubeUrl("");
      setCurrentVideoId(undefined);
      toast("Training video removed", "success");
    } catch {
      toast("Failed to remove video link", "error");
    } finally {
      setRemovingVideo(false);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDocument(true);

    try {
      const res = await fetch(`/api/session-documents/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: documentTitle,
          url: documentUrl,
          type: documentType,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast(data.error || "Failed to save training document", "error");
        return;
      }

      setHasDocument(true);
      toast("Training document saved", "success");
    } catch {
      toast("Failed to save training document", "error");
    } finally {
      setSavingDocument(false);
    }
  };

  const handleRemoveDocument = async () => {
    setRemovingDocument(true);
    try {
      const res = await fetch(`/api/session-documents/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Failed to remove training document", "error");
        return;
      }
      setDocumentTitle("");
      setDocumentUrl("");
      setDocumentType("link");
      setHasDocument(false);
      toast("Training document removed", "success");
    } catch {
      toast("Failed to remove training document", "error");
    } finally {
      setRemovingDocument(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSaveVideo}
        className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Training video</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Paste a YouTube link for this lesson. Only learners with access to this module can
              watch it.
            </p>
          </div>
        </div>
        <Input
          label="YouTube URL"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={savingVideo}>
            Save video link
          </Button>
          {currentVideoId && (
            <Button type="button" variant="secondary" loading={removingVideo} onClick={handleRemoveVideo}>
              Remove video
            </Button>
          )}
        </div>
      </form>

      {currentVideoId && (
        <div>
          <p className="mb-3 text-sm font-medium text-text-secondary">Video preview</p>
          <YouTubeEmbed videoId={currentVideoId} title={title} />
        </div>
      )}

      <form
        onSubmit={handleSaveDocument}
        className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Training document</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Add a workbook, slides, or reference link for this lesson. Learners with module access
              can open it from the session page.
            </p>
          </div>
        </div>
        <Input
          label="Document title"
          type="text"
          placeholder="Day 1 workbook"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          required
        />
        <Input
          label="Document URL"
          type="url"
          placeholder="https://drive.google.com/..."
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          required
        />
        <Select
          label="Document type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as SessionDocumentType)}
          options={documentTypeOptions}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={savingDocument}>
            Save training document
          </Button>
          {hasDocument && (
            <Button
              type="button"
              variant="secondary"
              loading={removingDocument}
              onClick={handleRemoveDocument}
            >
              Remove document
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}