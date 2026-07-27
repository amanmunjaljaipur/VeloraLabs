"use client";

/**
 * Friendly Train flow: three clear actions (voice / face / Drive) + samples list.
 * Homepage-style micro-interactions (motion lift, stagger, soft hover).
 */

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { useToast } from "@/components/ui/Toast";
import { DriveConnectorCard, type DriveStatusInfo } from "@/components/avatar-studio/DriveConnectorCard";
import { StudioVisualTip } from "@/components/avatar-studio/StudioVisualChrome";
import { extractFaceFramesFromVideo } from "@/lib/avatar-studio/client-extract-face-frames";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  ImagePlus,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  Square,
  Star,
  Trash2,
  Upload,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ProfileKind = "voice" | "avatar" | "both";
type TrainGoal = "voice" | "face" | "video";

interface ProfileMediaItem {
  id: string;
  provider: "blob" | "google_drive";
  url: string;
  mimeType?: string;
  kind: "image" | "audio" | "video" | string;
  label?: string;
}

interface CloneProfile {
  id: string;
  name: string;
  kind: ProfileKind;
  status: "processing" | "ready" | "failed";
  sourceMedia: { provider: "blob" | "google_drive"; url: string } | null;
  mediaBank?: ProfileMediaItem[];
  coverMediaId?: string | null;
  ttsVoiceHint?: string | null;
  geminiVoice?: string | null;
  voiceStylePrompt?: string | null;
  trainSummary?: string | null;
  createdAt: string;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

function coverUrlOf(p: CloneProfile): string | null {
  if (p.coverMediaId && p.mediaBank?.length) {
    const hit = p.mediaBank.find((m) => m.id === p.coverMediaId);
    if (hit?.url) return hit.url;
  }
  const img = p.mediaBank?.find((m) => m.kind === "image");
  if (img?.url) return img.url;
  return p.sourceMedia?.url ?? null;
}

function imageBankOf(p: CloneProfile): ProfileMediaItem[] {
  if (p.mediaBank?.length) {
    return p.mediaBank.filter((m) => m.kind === "image" || m.kind === "video");
  }
  if (p.sourceMedia?.url) {
    return [
      {
        id: "legacy",
        provider: p.sourceMedia.provider,
        url: p.sourceMedia.url,
        kind: "image",
      },
    ];
  }
  return [];
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

export function TrainCapturePanel({
  hasCloneConsent,
  onRequestConsent,
  driveStatus,
  onDriveChange,
}: {
  hasCloneConsent: boolean;
  onRequestConsent: () => void;
  driveStatus: DriveStatusInfo | null;
  onDriveChange: () => void;
}) {
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [profiles, setProfiles] = useState<CloneProfile[]>([]);
  /** Always open voice training by default so the option never "disappears". */
  const [goal, setGoal] = useState<TrainGoal | null>("voice");
  const [name, setName] = useState("");
  /** Single-file path (voice / video). */
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /** Multi-image bank while creating a face character. */
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [coverPendingId, setCoverPendingId] = useState<string | null>(null);
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);
  const [bankBusyId, setBankBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractPercent, setExtractPercent] = useState(0);
  const [extractLabel, setExtractLabel] = useState("");
  /** Free neural voice used when generating without a GPU clone host */
  const [ttsVoiceHint, setTtsVoiceHint] = useState("en-US-JennyNeural");
  const [voiceGender, setVoiceGender] = useState<"auto" | "male" | "female">("auto");
  const multiImageInputRef = useRef<HTMLInputElement | null>(null);
  const multiAngleVideoInputRef = useRef<HTMLInputElement | null>(null);
  const addToBankInputRef = useRef<HTMLInputElement | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micPermission, setMicPermission] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [camPermission, setCamPermission] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [requestingMedia, setRequestingMedia] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/profiles");
    const data = await parseJson(res);
    if (res.ok) setProfiles(data.profiles ?? []);
  }, []);

  useEffect(() => {
    void loadProfiles();
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfiles]);

  /** Read browser mic/camera permission state when Permissions API is available. */
  const refreshMediaPermissions = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    try {
      const mic = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setMicPermission(mic.state === "prompt" || mic.state === "granted" || mic.state === "denied" ? mic.state : "unknown");
      mic.onchange = () => {
        setMicPermission(
          mic.state === "prompt" || mic.state === "granted" || mic.state === "denied" ? mic.state : "unknown"
        );
      };
    } catch {
      /* Safari / some browsers throw on microphone query */
    }
    try {
      const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
      setCamPermission(cam.state === "prompt" || cam.state === "granted" || cam.state === "denied" ? cam.state : "unknown");
      cam.onchange = () => {
        setCamPermission(
          cam.state === "prompt" || cam.state === "granted" || cam.state === "denied" ? cam.state : "unknown"
        );
      };
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshMediaPermissions();
  }, [refreshMediaPermissions]);

  function setSelectedFile(next: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  function clearPendingImages() {
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setCoverPendingId(null);
  }

  function addPendingImageFiles(files: File[]) {
    const next: PendingImage[] = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
    if (next.length === 0) return;
    setPendingImages((prev) => [...prev, ...next].slice(0, 16));
    setCoverPendingId((prev) => prev ?? next[0]?.id ?? null);
    setSelectedFile(next[0]!.file);
    if (!name.trim()) setName("My character");
  }

  function addPendingFiles(fileList: FileList | File[]) {
    const list = Array.from(fileList);
    const images = list.filter((f) => f.type.startsWith("image/"));
    const videos = list.filter((f) => f.type.startsWith("video/"));
    if (images.length) {
      addPendingImageFiles(images);
      toast(
        images.length === 1 ? "Photo added to bank" : `${images.length} photos added to bank`,
        "success"
      );
    }
    // Videos → multi-angle frame extraction (Gemini-style training bank)
    if (videos.length) {
      void extractMultiAngleFromVideo(videos[0]!);
      if (videos.length > 1) {
        toast("Using the first video for multi-angle extract (one clip at a time)", "success");
      }
      return;
    }
    if (images.length === 0 && videos.length === 0) {
      toast("Pick image or video files", "error");
    }
  }

  /**
   * Gemini-style: multi-angle face video → diverse high-quality stills for the image bank.
   * Tries server ffmpeg first for HQ; falls back to in-browser extraction.
   */
  async function extractMultiAngleFromVideo(videoFile: File) {
    setError(null);
    setExtracting(true);
    setExtractPercent(0);
    setExtractLabel("Preparing multi-angle extract…");
    try {
      // 1) Prefer server ffmpeg when available
      let usedServer = false;
      try {
        setExtractLabel("Trying high-quality server extract (ffmpeg)…");
        setExtractPercent(8);
        const form = new FormData();
        form.set("file", videoFile);
        form.set("targetCount", "10");
        const res = await fetch("/api/avatar-studio/extract-frames", { method: "POST", body: form });
        const data = await parseJson(res);
        if (res.ok && Array.isArray(data.frames) && data.frames.length > 0) {
          const files: File[] = data.frames.map(
            (fr: { filename: string; mimeType: string; base64: string }) => {
              const bin = atob(fr.base64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              return new File([bytes], fr.filename || "face-angle.jpg", {
                type: fr.mimeType || "image/jpeg",
              });
            }
          );
          addPendingImageFiles(files);
          usedServer = true;
          toast(
            `Extracted ${files.length} high-quality training stills from video (server)`,
            "success"
          );
        }
      } catch {
        /* fall through to client */
      }

      if (!usedServer) {
        setExtractLabel("Extracting angles in browser…");
        const result = await extractFaceFramesFromVideo(videoFile, {
          targetCount: 10,
          jpegQuality: 0.95,
          maxSide: 1600,
          onProgress: (p, label) => {
            setExtractPercent(p);
            setExtractLabel(label);
          },
        });
        addPendingImageFiles(result.frames.map((f) => f.file));
        // revoke intermediate previews from extractor (we create new ones in addPending)
        result.frames.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        toast(
          `Extracted ${result.frames.length} multi-angle stills (${result.sourceWidth}×${result.sourceHeight} source) — pick a cover`,
          "success"
        );
      }
      setExtractPercent(100);
      setExtractLabel("Done — review bank and set cover");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not extract frames. Upload clear photos instead.";
      setError(msg);
      toast(msg, "error");
    } finally {
      setExtracting(false);
    }
  }

  function removePendingImage(id: string) {
    setPendingImages((prev) => {
      const victim = prev.find((p) => p.id === id);
      if (victim) URL.revokeObjectURL(victim.previewUrl);
      const next = prev.filter((p) => p.id !== id);
      if (coverPendingId === id) setCoverPendingId(next[0]?.id ?? null);
      if (next[0]) setSelectedFile(next.find((p) => p.id === (coverPendingId === id ? next[0]!.id : coverPendingId))?.file ?? next[0].file);
      else setSelectedFile(null);
      return next;
    });
  }

  function mediaErrorMessage(err: unknown, kind: "mic" | "camera"): string {
    const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return kind === "mic"
        ? "Microphone blocked. Click Allow in the browser popup, or use site settings → Microphone → Allow, then try again. Or upload an audio file."
        : "Camera blocked. Click Allow in the browser popup (or site settings → Camera → Allow). Or upload a photo.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return kind === "mic"
        ? "No microphone found on this device. Plug one in or upload an audio file."
        : "No camera found. Upload a photo instead.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return kind === "mic"
        ? "Microphone is in use by another app. Close it and try again, or upload audio."
        : "Camera is in use by another app. Close it and try again, or upload a photo.";
    }
    if (name === "SecurityError" || name === "TypeError") {
      return "This page cannot use the mic/camera (blocked by browser or missing secure context). Use https or localhost, or upload a file.";
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      return "This browser does not support live capture. Upload a file instead.";
    }
    return kind === "mic"
      ? "Could not open the microphone. Allow access when the browser asks, or upload an audio file."
      : "Could not open the camera. Allow access when the browser asks, or upload a photo.";
  }

  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
    setRecording(false);
    setRecordSeconds(0);
  }

  async function enableMic() {
    setError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Live mic is not available in this browser. Upload an audio file instead.");
      return;
    }
    stopAll();
    setRequestingMedia(true);
    try {
      // Direct browser permission prompt — user sees Allow / Block
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      streamRef.current = stream;
      setLive(true);
      setMicPermission("granted");
      toast("Microphone allowed — you can record now", "success");
    } catch (err) {
      setMicPermission("denied");
      setError(mediaErrorMessage(err, "mic"));
      toast("Microphone not allowed — use Allow, or upload audio", "error");
    } finally {
      setRequestingMedia(false);
      void refreshMediaPermissions();
    }
  }

  async function enableCamera() {
    setError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Live camera is not available in this browser. Upload a photo instead.");
      return;
    }
    stopAll();
    setRequestingMedia(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => null);
      }
      setLive(true);
      setCamPermission("granted");
      setMicPermission("granted");
      toast("Camera allowed — capture when ready", "success");
    } catch (err) {
      // Fall back to video-only if mic was denied with camera
      try {
        const videoOnly = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = videoOnly;
        if (videoRef.current) {
          videoRef.current.srcObject = videoOnly;
          await videoRef.current.play().catch(() => null);
        }
        setLive(true);
        setCamPermission("granted");
        toast("Camera allowed (no mic on this stream)", "success");
      } catch (err2) {
        setCamPermission("denied");
        setError(mediaErrorMessage(err2, "camera"));
        toast("Camera not allowed — use Allow, or upload a photo", "error");
      }
    } finally {
      setRequestingMedia(false);
      void refreshMediaPermissions();
    }
  }

  function rejectMicAndUpload() {
    stopAll();
    setError(null);
    setMicPermission((p) => (p === "granted" ? p : "denied"));
    toast("OK — pick an audio file instead", "success");
    audioInputRef.current?.click();
  }

  function rejectCamAndUpload() {
    stopAll();
    setError(null);
    mediaInputRef.current?.click();
  }

  function startRecord(audioOnly: boolean) {
    const stream = streamRef.current;
    if (!stream) {
      setError(audioOnly ? "Turn on the microphone first." : "Turn on the camera first.");
      return;
    }
    chunksRef.current = [];
    try {
      let mime = "";
      if (audioOnly) {
        mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
      } else {
        mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "";
      }
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || (audioOnly ? "audio/webm" : "video/webm");
        const ext = type.includes("mp4") ? "mp4" : type.includes("m4a") ? "m4a" : "webm";
        const f = new File(
          [new Blob(chunksRef.current, { type })],
          audioOnly ? `voice-${Date.now()}.${ext}` : `face-angles-${Date.now()}.webm`,
          { type }
        );
        if (!audioOnly && goal === "face") {
          // Gemini-style: pull multi-angle stills from the head-turn recording
          if (!name.trim()) setName("My character");
          toast("Recording saved — extracting multi-angle training stills…", "success");
          void extractMultiAngleFromVideo(f);
          return;
        }
        setSelectedFile(f);
        if (!name.trim()) setName(audioOnly ? "My voice" : "My face");
        toast(audioOnly ? "Voice ready — save below" : "Clip ready — save below", "success");
      };
      rec.start(200);
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Recording not supported here. Try Chrome, or upload a file.");
    }
  }

  function stopRecord() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    setRecording(false);
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !live) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return;
    const f = new File([blob], `face-${Date.now()}.jpg`, { type: "image/jpeg" });
    if (goal === "face") {
      addPendingFiles([f]);
    } else {
      setSelectedFile(f);
      if (!name.trim()) setName("My face");
      toast("Photo ready — save below", "success");
    }
  }

  async function handleSave() {
    if (!hasCloneConsent) {
      setError("Tap “I agree — enable training” above, then save.");
      onRequestConsent();
      return;
    }

    // Face character with multi-image bank
    if (goal === "face" && pendingImages.length > 0) {
      const sampleName = name.trim() || "My character";
      setUploading(true);
      setError(null);
      try {
        const form = new FormData();
        form.set("name", sampleName);
        form.set("kind", "avatar");
        const coverId = coverPendingId ?? pendingImages[0]!.id;
        const coverIdx = Math.max(
          0,
          pendingImages.findIndex((p) => p.id === coverId)
        );
        form.set("coverIndex", String(coverIdx));
        pendingImages.forEach((p) => form.append("files", p.file, p.file.name));
        const res = await fetch("/api/avatar-studio/profiles", { method: "POST", body: form });
        const data = await parseJson(res);
        if (!res.ok) {
          setError(data.error === "consent_required" ? "Grant consent first." : data.error || "Save failed");
          return;
        }
        toast(
          data.note ||
            `Character saved with ${pendingImages.length} photo${pendingImages.length > 1 ? "s" : ""}`,
          "success"
        );
        setName("");
        setSelectedFile(null);
        clearPendingImages();
        setGoal("voice");
        stopAll();
        void loadProfiles();
        void onDriveChange();
      } catch {
        setError("Save failed");
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!file) {
      setError(
        goal === "face"
          ? "Add at least one photo (camera or upload), pick a cover, then save."
          : "Record or upload a sample first."
      );
      return;
    }
    const kind: ProfileKind =
      goal === "voice" ? "voice" : goal === "face" ? "avatar" : file.type.startsWith("audio/") ? "voice" : "both";
    const sampleName = name.trim() || (kind === "voice" ? "My voice" : "My character");
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("name", sampleName);
      form.set("kind", kind);
      if (kind === "voice" || kind === "both") {
        form.set("ttsVoiceHint", ttsVoiceHint || "en-US-JennyNeural");
        form.set("preferredGender", voiceGender);
      }
      const res = await fetch("/api/avatar-studio/profiles", { method: "POST", body: form });
      const data = await parseJson(res);
      if (!res.ok) {
        setError(data.error === "consent_required" ? "Grant consent first." : data.error || "Save failed");
        return;
      }
      toast(
        driveStatus?.connected
          ? "Saved to your Google Drive folder"
          : data.note || "Sample saved — use it in Create",
        "success"
      );
      setName("");
      setSelectedFile(null);
      clearPendingImages();
      setGoal("voice");
      stopAll();
      void loadProfiles();
      void onDriveChange();
    } catch {
      setError("Save failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this sample?")) return;
    const res = await fetch(`/api/avatar-studio/profiles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Deleted", "success");
      if (expandedCharacterId === id) setExpandedCharacterId(null);
      void loadProfiles();
    } else toast("Could not delete", "error");
  }

  async function handleSetCover(profileId: string, mediaId: string) {
    setBankBusyId(profileId);
    try {
      const res = await fetch(`/api/avatar-studio/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverMediaId: mediaId }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not set cover", "error");
        return;
      }
      toast("Cover photo updated", "success");
      void loadProfiles();
    } finally {
      setBankBusyId(null);
    }
  }

  async function handleRemoveBankImage(profileId: string, mediaId: string) {
    if (!window.confirm("Remove this photo from the character bank?")) return;
    setBankBusyId(profileId);
    try {
      const res = await fetch(`/api/avatar-studio/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeMediaId: mediaId }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not remove photo", "error");
        return;
      }
      toast("Photo removed", "success");
      void loadProfiles();
    } finally {
      setBankBusyId(null);
    }
  }

  async function handleAddToBank(profileId: string, fileList: FileList | null) {
    if (!fileList?.length) return;
    setBankBusyId(profileId);
    try {
      const form = new FormData();
      Array.from(fileList).forEach((f) => form.append("files", f, f.name));
      const res = await fetch(`/api/avatar-studio/profiles/${profileId}/media`, {
        method: "POST",
        body: form,
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not add photos", "error");
        return;
      }
      toast(`Added ${data.added ?? fileList.length} photo(s) to bank`, "success");
      setExpandedCharacterId(profileId);
      void loadProfiles();
    } finally {
      setBankBusyId(null);
      if (addToBankInputRef.current) addToBankInputRef.current.value = "";
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Drive?")) return;
    await fetch("/api/avatar-studio/storage/drive/disconnect", { method: "POST" });
    toast("Drive disconnected", "success");
    onDriveChange();
  }

  const voiceList = profiles.filter((p) => p.kind === "voice" || p.kind === "both");
  const faceList = profiles.filter((p) => p.kind === "avatar" || p.kind === "both");

  function startGoal(next: TrainGoal) {
    // Always open the capture form — consent is only required at save time.
    setGoal(next);
    setError(null);
    stopAll();
    setSelectedFile(null);
    clearPendingImages();
    // Do not auto-open mic/camera — user taps Allow when ready
  }

  return (
    <div className="flex flex-col gap-6">
      <MotionReveal>
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <div className="relative h-36 w-full md:h-44">
            <Image
              src="/images/collaboration.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/40" />
            <div className="absolute inset-0 flex flex-col justify-end gap-3 p-5 md:flex-row md:items-end md:justify-between md:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">Train</p>
                <h2 className="text-2xl font-semibold text-white">Train a new voice</h2>
                <p className="mt-1 max-w-lg text-sm text-white/75">
                  Record or upload 15–30s → we build a voice profile → use it in Create
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-navy hover:bg-white/90 dark:bg-white dark:text-navy"
                onClick={() => startGoal("voice")}
              >
                <Mic className="size-5" />
                Train new voice
              </Button>
            </div>
          </div>
        </div>
      </MotionReveal>

      {!hasCloneConsent ? (
        <MotionReveal delay={0.04}>
          <Alert variant="warning" title="One-time consent (required to save)">
            <p className="mb-3 text-sm">
              Confirm you own this voice/face (or have permission). You can still open the recorder below — consent is
              only needed when you save.
            </p>
            <Button onClick={onRequestConsent}>I agree — enable training</Button>
          </Alert>
        </MotionReveal>
      ) : null}

      {/* Always-visible training actions (never hidden by consent) */}
      <MotionReveal delay={0.05}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card
            flush
            className={cn(
              "cursor-pointer border-2 transition-colors",
              goal === "voice" ? "border-accent-teal ring-2 ring-accent-teal/30" : "border-border hover:border-accent-teal/50"
            )}
            onClick={() => startGoal("voice")}
          >
            <CardContent className="gap-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
                <Mic className="size-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">1. Train new voice</p>
                <p className="text-sm text-text-secondary">Mic or upload audio · builds your voice profile</p>
              </div>
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  startGoal("voice");
                }}
              >
                <Mic className="size-4" />
                Start voice training
              </Button>
            </CardContent>
          </Card>

          <Card
            flush
            className={cn(
              "cursor-pointer border-2 transition-colors",
              goal === "face" ? "border-accent-teal ring-2 ring-accent-teal/30" : "border-border hover:border-accent-teal/50"
            )}
            onClick={() => startGoal("face")}
          >
            <CardContent className="gap-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
                <User className="size-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">2. Train face</p>
                <p className="text-sm text-text-secondary">Photos or multi-angle video</p>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  startGoal("face");
                }}
              >
                Start face training
              </Button>
            </CardContent>
          </Card>

          <Card
            flush
            className={cn(
              "cursor-pointer border-2 transition-colors",
              goal === "video" ? "border-accent-teal ring-2 ring-accent-teal/30" : "border-border hover:border-accent-teal/50"
            )}
            onClick={() => startGoal("video")}
          >
            <CardContent className="gap-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
                <Video className="size-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">3. Talking clip</p>
                <p className="text-sm text-text-secondary">Optional face + voice clip</p>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  startGoal("video");
                }}
              >
                Record clip
              </Button>
            </CardContent>
          </Card>
        </div>
      </MotionReveal>

      {/* Capture workspace — always shown when a goal is selected (default: voice) */}
      {goal ? (
        <MotionReveal>
          <Card flush className="border-accent-teal/40 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {goal === "voice" ? (
                  <>
                    <Mic className="size-5 text-accent-teal" />
                    Train new voice
                  </>
                ) : goal === "face" ? (
                  <>
                    <User className="size-5 text-accent-teal" />
                    Train face / character
                  </>
                ) : (
                  <>
                    <Video className="size-5 text-accent-teal" />
                    Talking clip
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {goal === "voice"
                  ? "1) Name it · 2) Record or upload 15–30s · 3) Save & train · then pick it in Create → Voice"
                  : goal === "face"
                    ? "Photos and/or multi-angle video. Pick a cover for Create."
                    : "Record yourself talking — optional face + voice sample."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasCloneConsent ? (
                <Alert variant="warning" title="Agree to save your sample" className="mb-4">
                  <p className="mb-2 text-sm">You can record/upload now. Tap agree before Save & train.</p>
                  <Button size="sm" onClick={onRequestConsent}>
                    I agree — enable training
                  </Button>
                </Alert>
              ) : null}
              <FieldGroup>
                <Input
                  label={goal === "face" ? "Character name" : "Name this voice"}
                  placeholder={
                    goal === "voice"
                      ? "Name for the voice list, e.g. “Aman — calm” (you’ll hear it in Create)"
                      : "Name for this character, e.g. “Aman” (all photos in the bank share this name)"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                {goal === "voice" ? (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/40 py-8 px-4">
                    <motion.button
                      type="button"
                      disabled={requestingMedia}
                      onClick={() => {
                        if (!live) void enableMic();
                        else if (!recording) startRecord(true);
                      }}
                      className={cn(
                        "flex size-28 items-center justify-center rounded-full border-4 transition-colors",
                        recording
                          ? "border-red-500 bg-red-500/20 text-red-600"
                          : "border-accent-teal bg-accent-teal/15 text-accent-teal",
                        requestingMedia && "opacity-60"
                      )}
                      animate={recording && !reduce ? { scale: [1, 1.06, 1] } : undefined}
                      transition={recording ? { repeat: Infinity, duration: 1.1 } : undefined}
                      aria-label={live ? "Start recording" : "Allow microphone"}
                    >
                      <Mic className="size-12" />
                    </motion.button>
                    <p className="text-sm font-medium text-foreground text-center">
                      {requestingMedia
                        ? "Browser is asking for mic access — choose Allow or Block"
                        : recording
                          ? `Recording… ${recordSeconds}s`
                          : live
                            ? "Mic on — press Record"
                            : "Choose: Allow mic or upload a file"}
                    </p>
                    <div className="w-full max-w-md">
                      <Select
                        label="My voice sounds"
                        value={voiceGender}
                        onChange={(e) => setVoiceGender(e.target.value as "auto" | "male" | "female")}
                        options={[
                          { value: "auto", label: "Auto-detect from sample" },
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                        ]}
                      />
                      <FieldDescription>
                        We train a voice profile from your recording (Gemini style match). Then Create uses that
                        trained profile — not the default catalogue voice.
                      </FieldDescription>
                    </div>
                    {micPermission === "denied" && !live ? (
                      <Alert variant="warning" title="Microphone is blocked for this site">
                        <p className="text-sm">
                          In the browser address bar, open the lock / site settings → set{" "}
                          <strong>Microphone</strong> to <strong>Allow</strong>, then click Allow microphone again.
                          Or skip and upload audio.
                        </p>
                      </Alert>
                    ) : null}
                    {!live ? (
                      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                          className="flex-1"
                          loading={requestingMedia}
                          onClick={() => void enableMic()}
                        >
                          <Mic className="size-4" /> Allow microphone
                        </Button>
                        <Button
                          className="flex-1"
                          variant="secondary"
                          onClick={rejectMicAndUpload}
                          disabled={requestingMedia}
                        >
                          <Upload className="size-4" /> Not now — upload
                        </Button>
                      </div>
                    ) : !recording ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button onClick={() => startRecord(true)}>
                          <Mic className="size-4" /> Record voice
                        </Button>
                        <Button variant="secondary" onClick={stopAll}>
                          Turn off mic
                        </Button>
                      </div>
                    ) : (
                      <Button variant="cta" onClick={stopRecord}>
                        <Square className="size-4" /> Stop ({recordSeconds}s)
                      </Button>
                    )}
                    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-transparent px-5 text-sm font-medium hover:bg-muted">
                      <Upload className="size-4" /> Upload audio file
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setSelectedFile(f);
                            if (!name.trim()) setName("My voice");
                            setError(null);
                            toast("Audio selected — save below", "success");
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-navy">
                      <video
                        ref={videoRef}
                        muted
                        playsInline
                        className={cn("mx-auto max-h-72 w-full object-cover", !live && "hidden")}
                      />
                      {!live ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 text-white/80">
                          <Camera className="size-8 opacity-50" />
                          <p className="text-sm">Camera off</p>
                        </div>
                      ) : null}
                    </div>
                    {camPermission === "denied" && !live ? (
                      <Alert variant="warning" title="Camera is blocked for this site">
                        <p className="text-sm">
                          Address bar → site settings → <strong>Camera → Allow</strong>, then try again. Or upload a
                          photo.
                        </p>
                      </Alert>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {!live ? (
                        <>
                          <Button loading={requestingMedia} onClick={() => void enableCamera()}>
                            <Camera className="size-4" /> Allow camera
                          </Button>
                          <Button variant="secondary" onClick={rejectCamAndUpload} disabled={requestingMedia}>
                            <Upload className="size-4" /> Not now — upload
                          </Button>
                        </>
                      ) : (
                        <>
                          {goal === "face" ? (
                            <Button
                              variant="secondary"
                              onClick={() => void capturePhoto()}
                              disabled={recording || extracting}
                            >
                              <ImagePlus className="size-4" /> Take photo
                            </Button>
                          ) : null}
                          {!recording ? (
                            <Button onClick={() => startRecord(false)} disabled={extracting}>
                              <Video className="size-4" />
                              {goal === "face" ? "Record multi-angle video" : "Record video"}
                            </Button>
                          ) : (
                            <Button variant="cta" onClick={stopRecord}>
                              <Square className="size-4" /> Stop ({recordSeconds}s)
                            </Button>
                          )}
                          <Button variant="secondary" onClick={stopAll}>
                            Turn off camera
                          </Button>
                        </>
                      )}
                      <label className="inline-flex cursor-pointer">
                        <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted">
                          <Upload className="size-4" />
                          {goal === "face" ? "Upload photos" : "Upload photo/video"}
                          <input
                            ref={mediaInputRef}
                            type="file"
                            accept={goal === "face" ? "image/*,video/*" : "video/*,image/*"}
                            multiple={goal === "face"}
                            className="sr-only"
                            onChange={(e) => {
                              if (goal === "face" && e.target.files?.length) {
                                addPendingFiles(e.target.files);
                                setError(null);
                              } else {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setSelectedFile(f);
                                  if (!name.trim()) setName("My face");
                                  setError(null);
                                  toast("File selected — save below", "success");
                                }
                              }
                              e.target.value = "";
                            }}
                          />
                        </span>
                      </label>
                      {goal === "face" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => multiImageInputRef.current?.click()}
                        >
                          <Plus className="size-4" /> Add more photos
                        </Button>
                      ) : null}
                      <input
                        ref={multiImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files?.length) addPendingFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <FieldDescription>
                      {requestingMedia
                        ? "Browser permission popup: choose Allow or Block."
                        : goal === "face"
                          ? "Good light · face fills frame · for video: slowly turn L/C/R (~8–15s)."
                          : "Good light, face centered. One clear photo is enough for free videos."}
                    </FieldDescription>
                  </div>
                )}

                {/* Gemini-style multi-angle face video → HQ image bank */}
                {goal === "face" ? (
                  <div className="rounded-xl border border-accent-teal/30 bg-accent-teal/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
                        <Sparkles className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">Multi-angle face video (recommended)</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Same idea as Gemini avatar capture: one short clip with several head angles becomes a
                          high-quality image bank for training. We pull clear stills automatically — you pick the
                          cover.
                        </p>
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-text-secondary">
                          <li>Face the camera, good light, no heavy filters.</li>
                          <li>Record or upload ~8–15s: look left → center → right (slow turns).</li>
                          <li>We extract 8–12 high-res JPEGs into your bank.</li>
                          <li>Star one cover photo, then save the character.</li>
                        </ol>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={extracting || requestingMedia}
                            onClick={() => {
                              if (!live) void enableCamera();
                              else if (!recording) startRecord(false);
                            }}
                          >
                            <Video className="size-4" />
                            {live ? (recording ? "Recording…" : "Record multi-angle") : "Open camera & record"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={extracting}
                            onClick={() => multiAngleVideoInputRef.current?.click()}
                          >
                            <Upload className="size-4" /> Upload face video
                          </Button>
                          <input
                            ref={multiAngleVideoInputRef}
                            type="file"
                            accept="video/*,.mp4,.webm,.mov,.m4v"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void extractMultiAngleFromVideo(f);
                              e.target.value = "";
                            }}
                          />
                        </div>
                        {extracting || extractPercent > 0 ? (
                          <div className="mt-3 rounded-lg border border-border bg-card p-3">
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                              <span className="flex items-center gap-1.5 font-medium text-foreground">
                                {extracting ? <Loader2 className="size-3.5 animate-spin" /> : null}
                                {extractLabel || "Extracting…"}
                              </span>
                              <span className="text-text-secondary">{extractPercent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-accent-teal transition-[width] duration-300"
                                style={{ width: `${Math.min(100, extractPercent)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Character image bank (pending) — pick cover before save */}
                {goal === "face" && pendingImages.length > 0 ? (
                  <Field>
                    <FieldLabel>Character image bank ({pendingImages.length})</FieldLabel>
                    <FieldDescription>
                      Tap a photo to set it as the <strong>cover</strong> (star). Cover is used in Create and free videos.
                    </FieldDescription>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {pendingImages.map((img) => {
                        const isCover = (coverPendingId ?? pendingImages[0]?.id) === img.id;
                        return (
                          <div
                            key={img.id}
                            className={cn(
                              "group relative overflow-hidden rounded-xl border-2 bg-muted",
                              isCover ? "border-accent-teal ring-2 ring-accent-teal/30" : "border-border"
                            )}
                          >
                            {img.file.type.startsWith("video/") ? (
                              <video src={img.previewUrl} className="aspect-square w-full object-cover" muted />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img.previewUrl} alt="" className="aspect-square w-full object-cover" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/55 p-1">
                              <button
                                type="button"
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-medium text-white",
                                  isCover ? "bg-accent-teal" : "bg-white/15 hover:bg-white/25"
                                )}
                                onClick={() => {
                                  setCoverPendingId(img.id);
                                  setSelectedFile(img.file);
                                  toast("Cover photo set", "success");
                                }}
                              >
                                <Star className={cn("size-3", isCover && "fill-current")} />
                                {isCover ? "Cover" : "Set cover"}
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-white/15 px-1.5 py-1 text-white hover:bg-red-500/80"
                                onClick={() => removePendingImage(img.id)}
                                aria-label="Remove photo"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => multiImageInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-secondary hover:border-accent-teal hover:text-accent-teal"
                      >
                        <Plus className="size-6" />
                        <span className="text-xs">Add</span>
                      </button>
                    </div>
                  </Field>
                ) : null}

                {previewUrl && file && goal !== "face" ? (
                  <Field>
                    <FieldLabel>Preview — ready to save</FieldLabel>
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="" className="max-h-48 rounded-lg object-contain" />
                    ) : file.type.startsWith("video/") ? (
                      <video src={previewUrl} controls className="max-h-48 w-full rounded-lg bg-navy" />
                    ) : (
                      <audio src={previewUrl} controls className="w-full" />
                    )}
                  </Field>
                ) : null}

                {error ? (
                  <Alert variant="destructive" title="Almost there">
                    {error}
                  </Alert>
                ) : null}
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  // Keep voice training visible — reset fields, don't hide the form
                  setGoal("voice");
                  stopAll();
                  setSelectedFile(null);
                  clearPendingImages();
                  setError(null);
                  setName("");
                }}
              >
                Clear
              </Button>
              <Button
                onClick={() => void handleSave()}
                loading={uploading || extracting}
                disabled={
                  extracting || (goal === "face" ? pendingImages.length === 0 && !file : !file)
                }
              >
                {goal === "voice"
                  ? "Save & train voice"
                  : goal === "face"
                    ? `Save character${pendingImages.length > 1 ? ` (${pendingImages.length} photos)` : ""}`
                    : "Save clip"}
                {driveStatus?.connected ? " to Drive" : ""}
              </Button>
            </CardFooter>
          </Card>
        </MotionReveal>
      ) : null}

      <DriveConnectorCard driveStatus={driveStatus} onDisconnect={handleDisconnect} compact />

      {/* Library */}
      <MotionReveal delay={0.06}>
        <Card flush>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Your library</CardTitle>
              <CardDescription>
                Trained voices appear in <strong>Create → Voice</strong>. Faces in <strong>Create → Face</strong>.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => startGoal("voice")}>
              <Mic className="size-4" />
              Train new voice
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">Voices ({voiceList.length})</p>
                {voiceList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                    <p className="mb-3 text-sm text-text-secondary">No trained voices yet.</p>
                    <Button size="sm" onClick={() => startGoal("voice")}>
                      <Mic className="size-4" /> Train new voice
                    </Button>
                  </div>
                ) : (
                  voiceList.map((p) => (
                    <motion.div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2"
                      whileHover={reduce ? undefined : { y: -1 }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-text-secondary">
                            {p.trainSummary
                              ? `Trained · ${p.trainSummary}`
                              : p.geminiVoice
                                ? `Trained · Gemini ${p.geminiVoice}`
                                : "Sample saved · not trained yet"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              void (async () => {
                                toast("Training voice from sample…", "success");
                                const res = await fetch(`/api/avatar-studio/profiles/${p.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ retrain: true }),
                                });
                                const data = await parseJson(res);
                                if (res.ok) {
                                  toast(data.profile?.trainSummary || "Voice trained", "success");
                                  void loadProfiles();
                                } else toast(data.error || "Train failed", "error");
                              })();
                            }}
                          >
                            {p.geminiVoice ? "Re-train" : "Train now"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleDelete(p.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">Characters / faces ({faceList.length})</p>
                {faceList.length === 0 ? (
                  <p className="text-sm text-text-secondary">None yet — use “Add face” and upload several photos.</p>
                ) : (
                  faceList.map((p) => {
                    const bank = imageBankOf(p);
                    const cover = coverUrlOf(p);
                    const expanded = expandedCharacterId === p.id;
                    const busy = bankBusyId === p.id;
                    return (
                      <motion.div
                        key={p.id}
                        className="rounded-xl border border-border"
                        whileHover={reduce ? undefined : { y: -1 }}
                      >
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            onClick={() => setExpandedCharacterId(expanded ? null : p.id)}
                          >
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" className="size-12 rounded-lg object-cover ring-2 ring-accent-teal/40" />
                            ) : (
                              <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                                <User className="size-4 text-text-secondary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-text-secondary">
                                {bank.length} photo{bank.length === 1 ? "" : "s"} · cover marked with ★
                              </p>
                            </div>
                          </button>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setExpandedCharacterId(expanded ? null : p.id)}
                            >
                              {expanded ? "Hide" : "Bank"}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => void handleDelete(p.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                        {expanded ? (
                          <div className="border-t border-border bg-muted/30 p-3">
                            <p className="mb-2 text-xs text-text-secondary">
                              Tap ★ to set cover. Cover is what Create uses for free videos.
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {bank.map((m) => {
                                const isCover = p.coverMediaId === m.id || (!p.coverMediaId && m.url === cover);
                                return (
                                  <div
                                    key={m.id}
                                    className={cn(
                                      "relative overflow-hidden rounded-lg border-2",
                                      isCover ? "border-accent-teal" : "border-transparent"
                                    )}
                                  >
                                    {m.kind === "video" ? (
                                      <video src={m.url} className="aspect-square w-full object-cover" muted />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={m.url} alt="" className="aspect-square w-full object-cover" />
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 flex gap-0.5 bg-black/60 p-0.5">
                                      <button
                                        type="button"
                                        disabled={busy || isCover}
                                        className={cn(
                                          "flex flex-1 items-center justify-center gap-0.5 rounded py-1 text-[10px] text-white",
                                          isCover ? "bg-accent-teal" : "hover:bg-white/20"
                                        )}
                                        onClick={() => void handleSetCover(p.id, m.id)}
                                      >
                                        <Star className={cn("size-3", isCover && "fill-current")} />
                                        {isCover ? "Cover" : "Cover"}
                                      </button>
                                      {bank.length > 1 ? (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          className="rounded px-1.5 py-1 text-white hover:bg-red-500/80"
                                          onClick={() => void handleRemoveBankImage(p.id, m.id)}
                                          aria-label="Remove"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-text-secondary hover:border-accent-teal hover:text-accent-teal">
                                <Plus className="size-5" />
                                <span className="text-[10px]">{busy ? "…" : "Add"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="sr-only"
                                  disabled={busy}
                                  onChange={(e) => void handleAddToBank(p.id, e.target.files)}
                                />
                              </label>
                              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-accent-teal/40 text-accent-teal hover:bg-accent-teal/5">
                                <Video className="size-5" />
                                <span className="px-1 text-center text-[10px] leading-tight">
                                  {busy ? "…" : "Video → stills"}
                                </span>
                                <input
                                  type="file"
                                  accept="video/*,.mp4,.webm,.mov"
                                  className="sr-only"
                                  disabled={busy || extracting}
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = "";
                                    if (!f) return;
                                    // Extract locally then upload stills into this character bank
                                    setBankBusyId(p.id);
                                    setExpandedCharacterId(p.id);
                                    try {
                                      setExtracting(true);
                                      const result = await extractFaceFramesFromVideo(f, {
                                        targetCount: 10,
                                        jpegQuality: 0.95,
                                        maxSide: 1600,
                                        onProgress: (pct, label) => {
                                          setExtractPercent(pct);
                                          setExtractLabel(label);
                                        },
                                      });
                                      const form = new FormData();
                                      result.frames.forEach((fr) => form.append("files", fr.file, fr.file.name));
                                      result.frames.forEach((fr) => URL.revokeObjectURL(fr.previewUrl));
                                      const res = await fetch(`/api/avatar-studio/profiles/${p.id}/media`, {
                                        method: "POST",
                                        body: form,
                                      });
                                      const data = await parseJson(res);
                                      if (!res.ok) {
                                        toast(data.error || "Could not add extracted frames", "error");
                                        return;
                                      }
                                      toast(
                                        `Added ${result.frames.length} multi-angle stills to ${p.name}`,
                                        "success"
                                      );
                                      void loadProfiles();
                                    } catch (err) {
                                      toast(
                                        err instanceof Error ? err.message : "Frame extract failed",
                                        "error"
                                      );
                                    } finally {
                                      setExtracting(false);
                                      setBankBusyId(null);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    );
                  })
                )}
                {/* Hidden shared ref not required — each row has its own input */}
                <input ref={addToBankInputRef} type="file" className="hidden" />
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionReveal>
    </div>
  );
}
