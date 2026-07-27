# Durable storage (deploy-safe, cost-aware)

## Problem

Runtime JSON was stored as many private Vercel Blob objects under `verlin-labs/data/*.json`. That **survives deploys** (good) but **re-uploading large JSON on every write gets expensive** as Avatar Studio / Marketing / App Builder grow.

Binary media (audio, video, portraits) is a separate cost driver.

## Policy (current code)

| Data type | Primary store | Fallback | Survives deploys? |
|-----------|---------------|----------|-------------------|
| Runtime JSON (jobs, tokens, roles, marketing, ops memory, avatar settings…) | **Postgres** (`DATABASE_URL`) | Vercel Blob if no DB | Yes (Postgres or Blob) |
| Generated media (mp3/mp4/jpg) | **User Google Drive** if connected | Vercel Blob private + `/api/media` | Yes |
| Local dev without env | `content/` filesystem | — | N/A (not production) |

Implementation:

- `src/lib/db/postgres.ts` + `src/lib/db/runtime-docs.ts` — table `runtime_docs`
- `src/lib/data-store.ts` — reads/writes hydrate from **Postgres first**, then Blob; skips Blob JSON writes when DB is set (unless `DURABLE_JSON_DUAL_WRITE=1`)
- `src/lib/avatar-studio/storage-adapter.ts` — media only; prefer Drive

## Setup (Neon free tier — recommended)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string.
3. Local `.env.local` and Vercel Project → Environment Variables:

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

4. Redeploy. Schema `runtime_docs` is created automatically on first write/read.
5. (Optional) Migrate existing Blob JSON once:

```bash
npm run migrate:json-to-db
```

6. Confirm as super admin: `GET /api/admin/diagnostics/storage`  
   Expect `"backend": "postgres"` and `"survivesDeploy": true`.

## Cutover / dual-write

| Env | Effect |
|-----|--------|
| `DATABASE_URL` only | JSON → Postgres only (Blob for media still ok) |
| `DURABLE_JSON_DUAL_WRITE=1` | Write JSON to **both** Postgres and Blob (safe migration) |
| Neither DB nor Blob on Vercel | **Data lost on deploy** — avoid |

After migration and verification, leave dual-write **off** to stop paying for Blob JSON rewrites.

## What not to put in Postgres

- Large binaries (use Drive / Blob media paths)
- Secrets in git — only in Vercel env

## Cost notes

- Neon free tier is usually enough for JSON document volume of this app.
- Blob remains useful for short-lived or public media; user Drive offloads the heaviest Avatar Studio outputs.
