"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { SessionDocumentRecord, SessionDocumentType } from "@/lib/session-documents";
import { ExternalLink, FileText, Plus, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { YouTubeEmbed } from "./YouTubeEmbed";

interface SessionResourcesAdminProps {
  sessionId: string;
  initialVideoUrl: string;
  videoId?: string;
  initialDocuments: SessionDocumentRecord[];
  title: string;
}

interface DraftDocument {
  adminUrl: string;
  title: string;
  learnerUrl: string;
  type: SessionDocumentType;
  summary: string;
  visibleToLearners: boolean;
}

const emptyDraft = (): DraftDocument => ({
  adminUrl: "",
  title: "",
  learnerUrl: "",
  type: "link",
  summary: "",
  visibleToLearners: true,
});

export function SessionResourcesAdmin({
  sessionId,
  initialVideoUrl,
  videoId,
  initialDocuments,
  title,
}: SessionResourcesAdminProps) {
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState(initialVideoUrl);
  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [savingVideo, setSavingVideo] = useState(false);
  const [removingVideo, setRemovingVideo] = useState(false);

  const [documents, setDocuments] = useState(initialDocuments);
  const [draft, setDraft] = useState<DraftDocument>(emptyDraft());
  const [previewing, setPreviewing] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [removingDocumentId, setRemovingDocumentId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(initialDocuments.length === 0);

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

  const handlePreviewDocument = async () => {
    if (!draft.adminUrl.trim()) {
      toast("Paste a Google Drive link first", "error");
      return;
    }

    setPreviewing(true);
    try {
      const res = await fetch("/api/session-documents/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: draft.adminUrl, title: draft.title || undefined }),
      });
      const data = (await res.json()) as DraftDocument & {
        error?: string;
        summaryGeneratedBy?: string;
      };

      if (!res.ok) {
        toast(data.error || "Could not fetch document details", "error");
        return;
      }

      setDraft({
        adminUrl: data.adminUrl,
        title: data.title,
        learnerUrl: data.learnerUrl,
        type: data.type,
        summary: data.summary,
        visibleToLearners: draft.visibleToLearners,
      });
      toast(
        data.summaryGeneratedBy === "ai" ? "Fetched title and AI summary" : "Fetched document details",
        "success"
      );
    } catch {
      toast("Could not fetch document details", "error");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.adminUrl.trim() || !draft.title.trim()) {
      toast("Fetch document details or enter a title before saving", "error");
      return;
    }

    setSavingDocument(true);
    try {
      const res = await fetch(`/api/session-documents/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as {
        error?: string;
        documents?: SessionDocumentRecord[];
      };

      if (!res.ok) {
        toast(data.error || "Failed to save training document", "error");
        return;
      }

      setDocuments(data.documents ?? []);
      setDraft(emptyDraft());
      setShowAddForm(false);
      toast("Training document saved", "success");
    } catch {
      toast("Failed to save training document", "error");
    } finally {
      setSavingDocument(false);
    }
  };

  const handleToggleVisibility = async (document: SessionDocumentRecord) => {
    const res = await fetch(`/api/session-documents/${sessionId}/${document.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleToLearners: !document.visibleToLearners }),
    });
    const data = (await res.json()) as { documents?: SessionDocumentRecord[]; error?: string };
    if (!res.ok) {
      toast(data.error || "Failed to update visibility", "error");
      return;
    }
    setDocuments(data.documents ?? []);
  };

  const handleRemoveDocument = async (documentId: string) => {
    setRemovingDocumentId(documentId);
    try {
      const res = await fetch(`/api/session-documents/${sessionId}/${documentId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { documents?: SessionDocumentRecord[]; error?: string };
      if (!res.ok) {
        toast(data.error || "Failed to remove training document", "error");
        return;
      }
      setDocuments(data.documents ?? []);
      toast("Training document removed", "success");
    } catch {
      toast("Failed to remove training document", "error");
    } finally {
      setRemovingDocumentId(null);
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
              Paste a YouTube link for this lesson.
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

      <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Training documents</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add Google Drive links. Learners see the student link when access is enabled.
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setShowAddForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            Add document
          </Button>
        </div>

        {documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{document.title}</p>
                    <p className="mt-1 text-sm text-text-secondary capitalize">{document.type}</p>
                    {document.summary && (
                      <p className="mt-2 text-sm text-text-secondary">{document.summary}</p>
                    )}
                  </div>
                  <span
                    className={
                      document.visibleToLearners
                        ? "rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-text-secondary"
                    }
                  >
                    {document.visibleToLearners ? "Visible to learners" : "Hidden from learners"}
                  </span>
                </div>

                <div className="grid gap-2 text-sm">
                  <a
                    href={document.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal hover:underline"
                  >
                    Admin Google Drive link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={document.learnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal hover:underline"
                  >
                    Learner view link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleToggleVisibility(document)}
                  >
                    {document.visibleToLearners ? "Hide from learners" : "Allow learner access"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={removingDocumentId === document.id}
                    onClick={() => void handleRemoveDocument(document.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSaveDocument} className="space-y-4 border-t border-border pt-4">
            <Input
              label="Google Drive URL"
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={draft.adminUrl}
              onChange={(e) => setDraft((value) => ({ ...value, adminUrl: e.target.value }))}
              required
            />
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" loading={previewing} onClick={handlePreviewDocument}>
                <Sparkles className="h-4 w-4" />
                Fetch name & summary
              </Button>
            </div>
            <Input
              label="Document title"
              type="text"
              placeholder="Fetched automatically from Google Drive"
              value={draft.title}
              onChange={(e) => setDraft((value) => ({ ...value, title: e.target.value }))}
              required
            />
            <label className="block text-sm">
              <span className="mb-2 block font-medium text-foreground">Summary</span>
              <textarea
                value={draft.summary}
                onChange={(e) => setDraft((value) => ({ ...value, summary: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Generated automatically for public documents"
              />
            </label>
            <Input
              label="Learner view link"
              type="url"
              placeholder="Link students and other roles will open"
              value={draft.learnerUrl}
              onChange={(e) => setDraft((value) => ({ ...value, learnerUrl: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.visibleToLearners}
                onChange={(e) =>
                  setDraft((value) => ({ ...value, visibleToLearners: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
              />
              Allow learners to access this document
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={savingDocument}>
                Save document
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}