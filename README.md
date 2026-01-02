# ArchLens Frontend (Next.js)

This app integrates the ArchLens backend using **only**:

- `POST /jobs`
- `GET /jobs/{job_id}`

When the job is **DONE**, it renders:

- Architecture text from `result.architecture`
- Diagram image from `result.diagram.url` (typically a presigned S3 HTTPS URL)

## Setup

1) Ensure the ArchLens backend is running (default base: `http://127.0.0.1:8000`).

2) Configure env:

- Copy `.env.example` → `.env.local` (or edit `.env.local` directly)
- Set `NEXT_PUBLIC_ARCHLENS_API_BASE`

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## E2E (Playwright)

Requires a running backend.

```bash
npm run test:e2e
```
