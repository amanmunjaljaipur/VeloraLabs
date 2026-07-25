# Avatar Studio — Agent Pipeline

Each agent is a single-purpose module: one file, one job, independently
versioned. This doc is the tracking table the product spec calls for
("each agent has one job, is independently versioned, tracked in
agents/README.md — name, responsibility, inputs/outputs, version, owner").

Pipeline order for one job:

```
Intake -> Enrichment -> Moderation -> Model Selector -> Queue/Orchestration
   -> Voice -> Avatar -> QA (retry once if below threshold) -> Transcript -> Feedback (ongoing)
                                                                  |
                                                              Audit (every stage)
```

Moderation and Model Selector run **synchronously in the job-creation API
route**, before a job record exists or any tokens are spent — a script
never gets charged or queued if it fails moderation or the user can't
afford it. Everything from Voice onward runs inside `queue-agent.ts`'s
`processJob()`, invoked via `after()` on job creation and swept by the
`avatar-studio-queue` cron for anything stuck.

| Agent | File | Responsibility | Input → Output | Version | Owner |
|---|---|---|---|---|---|
| Intake | `intake-agent.ts` | Turns a category + topic into a first-draft script (LLM-backed via the existing chat client), or normalizes a user-pasted script. | `(categoryId, topic)` → script text | 1.0.0 | Avatar Studio |
| Enrichment | `enrichment-agent.ts` | Adds category-specific structure/context to a script before moderation (tone, framing cues). | `(categoryId, script)` → enriched script | 1.0.0 | Avatar Studio |
| Moderation | `moderation-agent.ts` | Screens a script before any GPU time or tokens are spent. Category-aware strictness (`standard` vs `elevated`). Fails closed on any error. | `(script, moderationLevel)` → `ModerationResult` | 1.0.0 | Avatar Studio |
| Model Selector | `model-selector-agent.ts` | Estimates token cost from script length + chosen models/tier, checks balance, reserves (consumes) tokens, suggests the free fallback pair when unaffordable. | `(email, jobId, voiceModelId, avatarModelId, tier, script)` → cost estimate / reservation result | 1.0.0 | Avatar Studio |
| Queue/Orchestration | `queue-agent.ts` | Runs a single-clip job through Voice → Avatar → QA (auto-retry once) → Transcript → complete/failed, refunding tokens on any failure. Delegates to the Long-Form Agent when `job.mode === "long_form"`. Invoked by `after()` and the cron sweep. | `jobId` → job status update (side effect) | 1.1.0 | Avatar Studio |
| Voice | `voice-agent.ts` | Dispatches to the selected TTS/voice-clone model's self-hosted endpoint (env-var configured). Fails clearly if no endpoint is wired up yet — no fake audio. | `(voiceModelId, script, tier, voiceProfileId)` → `GenerationResult` | 1.0.0-stub | Avatar Studio |
| Avatar | `avatar-agent.ts` | Dispatches to the selected avatar/lip-sync model's self-hosted endpoint. Same real-dispatcher-stubbed-backend pattern as Voice. Accepts an optional `referenceImageUrl` (previous clip's last frame) for long-form chaining. | `(avatarModelId, audioUrl, tier, avatarProfileId, referenceImageUrl?)` → `GenerationResult` | 1.1.0-stub | Avatar Studio |
| Model Failover | `model-failover.ts` | Wraps a Voice/Avatar generation call with automatic model substitution: tries the user's chosen model, then the rest of that kind's catalog, then the zero-token free-tier model last, stopping at the first success. Shared by the single-clip and long-form pipelines. | `(kind, preferredModelId, attempt)` → `FailoverOutcome` | 1.0.0 | Avatar Studio |
| Long-Form | `long-form-agent.ts` | Splits a script into clip-sized segments (per the avatar model's `maxClipSeconds`), renders each sequentially with last-frame-to-next-frame continuity and per-segment model failover, and stitches the finished clips into one video. Time-boxes itself per invocation and is safe to resume across cron sweeps. | `jobId` → job status/segments update (side effect); `planSegments(script, avatarModelId)` → `LongFormSegmentState[]` | 1.0.0 | Avatar Studio |
| Video Stitch | `video-stitch-agent.ts` | Extracts a clip's last frame (for the next clip's continuity) and concatenates all finished clips into the final long-form video. Pure ffmpeg - no GPU/ML needed, so this is the cheapest piece of the long-form pipeline to stand up for real. | `extractLastFrame(videoUrl)` → image ref; `stitchClips(videoUrls[])` → final video ref | 1.0.0-stub | Avatar Studio |
| QA | `qa-agent.ts` | Automated post-render check. Currently scores on generation success + plausible duration; a GPU host would extend this with real lip-sync/audio-quality scoring. | `{voiceOk, avatarOk, durationSeconds, expectedMinutes}` → `QaResult` | 1.0.0-stub | Avatar Studio |
| Transcript | `transcript-agent.ts` | Powers the transcript editor. Prefers a real STT endpoint if configured; otherwise derives a genuinely usable transcript by sentence-splitting the known script and estimating timestamps from speaking rate. | `(script, audioUrl)` → `TranscriptSegment[]` | 1.0.0 | Avatar Studio |
| Feedback | `feedback-agent.ts` | Records every correction/edit/regenerate/rating the moment it happens, feeding the daily training pool. Thin wrapper over `feedback-store.ts`. | correction/edit/rating event → logged `FeedbackEntry` | 1.0.0 | Avatar Studio |
| Audit | `audit-agent.ts` | Logs stage transitions and routes failures into the platform's existing diagnostics log so pipeline issues surface where every other production issue does. | `(jobId, stage, detail)` → log entry (side effect) | 1.0.0 | Avatar Studio |

## What "stub" means here

Voice and Avatar are real dispatchers with a documented HTTP contract
(see each file's docstring) — point `endpointEnvVar` (from
`model-catalog.ts`) at a real self-hosted inference server and they work
without further code changes. This sandbox has no GPU, so until a real
endpoint is configured they return a clear, honest error rather than
fake output. QA is genuinely functional but scores a narrower signal
(success + duration plausibility) than a GPU host could (lip-sync
confidence, audio artifacts) — extend `evaluateOutput` once real
inference is wired up. Transcript is fully functional in both modes: a
real STT endpoint if configured, otherwise a script-derived estimate
that's still a usable, editable transcript.

## Long-form mode

A job created with `mode: "long_form"` and a `targetDurationMinutes` (up to
30) skips straight-through single-clip rendering. Instead:

1. The script is generated (or reviewed/edited) at full length up front -
   `intake-agent.ts`'s `generateLongFormScript` targets ~150 words/minute
   of narration, extending across multiple LLM calls if one completion
   doesn't reach the target length.
2. At job creation, `long-form-agent.ts`'s `planSegments` splits that script
   into clip-sized chunks (sentence-aware, sized to the chosen avatar
   model's `maxClipSeconds`) and stores the plan on `job.segments`.
3. `processLongFormJob` renders segments one at a time: Voice → Avatar for
   each, with the previous segment's last frame passed in as
   `referenceImageUrl` so the avatar doesn't visibly jump between clips.
   Every generation call goes through Model Failover, so a model running
   out of free quota partway through a long job doesn't stall it.
4. Once every segment is complete, `video-stitch-agent.ts` concatenates
   them into the final video.

Because a 10-20 minute video can mean dozens of sequential clips, one
invocation only works for `TIME_BUDGET_MS` (~45s) before returning with the
job left non-terminal - the `avatar-studio-queue` cron (every 2 minutes,
see `vercel.json`) picks it back up and continues from the first
incomplete segment. No separate long-running worker or queue service is
needed; progress is durable in the job record itself.

## Training loop control

The daily self-improving loop (`training-store.ts`) is intentionally
**owner-controlled and pausable** (`getTrainingSettings` /
`setTrainingPaused`), and every batch is retained permanently with full
lineage back to the `FeedbackEntry` records it was built from
(`TrainingBatch.feedbackEntryIds`) — nothing is deleted or summarized
away. Actual model fine-tuning still requires a GPU training host; this
scaffold tracks *what* would be trained on and *when*, with the human
gate already in place.
