# AZ-204 Quiz App (Next.js)

Interactive quiz app for [AZ-204: Developing Solutions for Microsoft Azure](https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/), built with Next.js 15 (App Router).

## Features

- 📝 Topic-based quizzes with progress tracking
- 🔄 Cross-device sync via short codes (e.g. `AZ-X7K9M2`)
- 📊 Leitner spaced-repetition system
- 🌙 Dark mode support

## Local Development

```bash
npm install
npm run dev
```

### Environment Variables

For the sync feature, create `.env.local`:

```env
KV_REST_API_URL=<your-upstash-redis-rest-url>
KV_REST_API_TOKEN=<your-upstash-redis-rest-token>
```

## Vercel Deployment

This app lives in a monorepo. **You must set the Root Directory in the Vercel Dashboard:**

1. Go to **Project Settings → General → Root Directory**
2. Set it to `modern-quiz-app`
3. Set Framework Preset to **Next.js** (should auto-detect)

> ⚠️ `rootDirectory` is a project-level setting — it cannot be configured via `vercel.json`.

### Required Environment Variables (Vercel Dashboard)

| Variable            | Description              |
| ------------------- | ------------------------ |
| `KV_REST_API_URL`   | Upstash Redis REST URL   |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |

## Architecture

```
src/
├── app/
│   ├── api/sync/[code]/   # Sync API (GET/POST, Upstash Redis)
│   ├── dashboard/          # Progress dashboard
│   └── page.tsx            # Main quiz page
└── lib/
    ├── generate-sync-code.ts  # Shared types (SyncData), code gen/validation
    └── sync-client.ts         # Client-side sync helpers
```

## Tests

```bash
npx jest
```
