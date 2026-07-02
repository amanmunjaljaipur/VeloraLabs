"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { useState } from "react";

interface SessionVideoAdminProps {
  sessionId: string;
  initialUrl: string;
  videoId?: string;
  title: string;
}

export function SessionVideoAdmin({
  sessionId,
  initialUrl,
  videoId,
  title,
}: SessionVideoAdminProps) {
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState(initialUrl);
  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
      toast("Session video saved", "success");
    } catch {
      toast("Failed to save video link", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/session-videos/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Failed to remove video link", "error");
        return;
      }
      setYoutubeUrl("");
      setCurrentVideoId(undefined);
      toast("Session video removed", "success");
    } catch {
      toast("Failed to remove video link", "error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Add session video</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Paste a YouTube link. Only logged-in students, engineers, and professionals in this
            track can watch it here.
          </p>
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
          <Button type="submit" loading={saving}>
            Save video link
          </Button>
          {currentVideoId && (
            <Button type="button" variant="secondary" loading={removing} onClick={handleRemove}>
              Remove video
            </Button>
          )}
        </div>
      </form>

      {currentVideoId && (
        <div>
          <p className="mb-3 text-sm font-medium text-text-secondary">Preview</p>
          <YouTubeEmbed videoId={currentVideoId} title={title} />
        </div>
      )}
    </div>
  );
}