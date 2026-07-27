"use client";

/**
 * Popup to pick a new voice for an existing completed video.
 * Lists free catalogue + trained samples + link to Train new — without leaving My videos.
 */

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  FreeVoiceList,
  TrainedVoiceList,
  type TrainProfileLite,
} from "@/components/avatar-studio/VoiceCharacterPicker";
import { isFreeVoiceId } from "@/lib/avatar-studio/free-voices";
import { Mic, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function ChangeVoiceModal({
  open,
  onClose,
  currentVoiceId,
  profiles,
  hasCloneConsent,
  submitting,
  error,
  onSubmit,
  onTrainNew,
}: {
  open: boolean;
  onClose: () => void;
  currentVoiceId: string | null;
  profiles: TrainProfileLite[];
  hasCloneConsent: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (voiceProfileId: string) => void;
  onTrainNew: () => void;
}) {
  const voiceProfiles = profiles.filter((p) => p.kind === "voice" || p.kind === "both");
  const [selectedId, setSelectedId] = useState(currentVoiceId || "");

  useEffect(() => {
    if (open) {
      setSelectedId(currentVoiceId || "");
    }
  }, [open, currentVoiceId]);

  function selectVoice(id: string) {
    setSelectedId(id);
  }

  const needsConsent = selectedId && !isFreeVoiceId(selectedId) && !hasCloneConsent;
  const canApply = Boolean(selectedId) && !needsConsent && selectedId !== currentVoiceId;

  return (
    <Modal open={open} onClose={onClose} title="Change video voice" className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Pick any free or trained voice. We re-generate the <strong>full audio</strong> for this video
          (same script &amp; face). Stays in a popup — your place on My videos is kept.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1" style={{ maxHeight: "min(52vh, 420px)" }}>
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Free catalogue
              </p>
              <FreeVoiceList
                selectedIds={selectedId ? [selectedId] : []}
                primaryId={selectedId}
                onToggle={selectVoice}
                onSetPrimary={selectVoice}
              />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Your trained voices
                </p>
                <Button type="button" size="sm" variant="secondary" onClick={onTrainNew}>
                  <Plus className="size-4" />
                  Train new voice
                </Button>
              </div>
              <TrainedVoiceList
                profiles={voiceProfiles}
                selectedIds={selectedId ? [selectedId] : []}
                primaryId={selectedId}
                onToggle={selectVoice}
                onSetPrimary={selectVoice}
              />
            </div>
          </div>
        </div>

        {needsConsent ? (
          <Alert variant="warning" title="Consent needed">
            Grant voice/face consent on the Train tab before using a trained sample.
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive" title="Could not update voice">
            {error}
          </Alert>
        ) : null}

        {selectedId && selectedId === currentVoiceId ? (
          <p className="text-xs text-text-secondary">This voice is already used on the video — pick another.</p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={submitting}
            disabled={!canApply || submitting}
            onClick={() => {
              if (selectedId) onSubmit(selectedId);
            }}
          >
            <Mic className="size-4" />
            Update full voice
          </Button>
        </div>
      </div>
    </Modal>
  );
}
