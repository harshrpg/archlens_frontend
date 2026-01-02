# ArchLens Backend → Next.js Frontend Integration

This document describes what your Next.js frontend should send to, and expect back from, the ArchLens backend API.

## Base URL

- Local: `http://127.0.0.1:8000`
- Deployed: your App Runner service URL (e.g. `https://<service>.<region>.awsapprunner.com`)

All endpoints return JSON.

## Common request shape

### POST body: `URLSubmission`

```ts
export type URLSubmission = {
  url: string; // must be a valid absolute URL (FastAPI validates as HttpUrl)
};
```

## Common error shape

On errors, FastAPI returns:

```ts
export type FastApiError = {
  detail: string;
};
```

Typical status codes:

- `400`: URL scrape failed / no meaningful content extracted
- `500`: unexpected server error
- `504`: gateway timeout (possible on some deployments if the request takes too long)

## Endpoints

### GET `/health`

Response:

```ts
export type HealthResponse = { status: 'ok' };
```

### GET `/version`

Response:

```ts
export type VersionResponse = { version: string };
```

### POST `/jobs` (async; recommended)

Request body: `URLSubmission`

Response: `JobCreateResponse`

```ts
export type JobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';

export type JobCreateResponse = {
  job_id: string;
  status: JobStatus; // always QUEUED on creation
  created_at: string; // ISO8601
};
```

### GET `/jobs/{job_id}` (async; recommended)

Response: `JobGetResponse`

```ts
export type JobGetResponse = {
  job_id: string;
  status: JobStatus;

  input_url: string;

  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;

  error_message: string | null; // only when FAILED

  // When DONE, either:
  // - result is present (inline), OR
  // - result_url / result_s3_uri points to persisted JSON.
  result: ArchLensResult | null;
  result_s3_uri: string | null;
  result_url: string | null;

  diagram_code_s3_uri: string | null;
};
```

### POST `/generate-architecture`

Request body: `URLSubmission`

Response: `AWSArchitecture`

```ts
export type AWSService = {
  name: string;
  role: string;
  description: string;
};

export type AWSArchitecture = {
  title: string;
  summary: string;
  assumptions: string[];
  functional_reasoning: string;
  non_functional_reasoning: string;
  key_tradeoffs: string[];
  components: AWSService[];
  data_flow: string;
  benefits: string[];
};
```

### POST `/generate-architecture-with-diagram`

Request body: `URLSubmission`

Response: `ArchLensResult` (architecture + optional diagram artifact)

```ts
export type DiagramArtifact = {
  /**
   * Server-side filesystem path (useful for debugging; not directly loadable by browser).
   * Often null in production deployments unless you also expose the file.
   */
  png_path: string | null;

  /** S3 URI if uploaded (e.g. "s3://bucket/key") */
  s3_uri: string | null;

  /**
   * Recommended field for frontend display:
   * - presigned HTTPS URL (if configured), or
   * - S3 URI fallback (not directly renderable by browser).
   */
  url: string | null;

  /** Python diagrams DSL code used to generate the diagram (useful for debugging/replay). */
  diagram_code: string | null;
};

export type ArchLensResult = {
  architecture: AWSArchitecture;
  diagram: DiagramArtifact | null;
};
```

Frontend expectations:

- `diagram` can be `null` (diagram generation disabled/unavailable).
- `diagram.url` can be `null` (S3 upload not configured or failed) even if `diagram_code` exists.
- If you want to render the diagram image in the browser, you generally need **`diagram.url`** to be an **HTTPS URL** (e.g., an S3 presigned URL).

## Next.js `fetch()` examples

### Basic helper

```ts
export async function postJson<TResponse>(
  url: string,
  body: unknown,
  init?: RequestInit
): Promise<TResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(err?.detail ?? `Request failed: ${res.status}`);
  }

  return (await res.json()) as TResponse;
}
```

### Call `/generate-architecture-with-diagram`

```ts
const apiBase = process.env.NEXT_PUBLIC_ARCHLENS_API_BASE!;

const result = await postJson<ArchLensResult>(`${apiBase}/generate-architecture-with-diagram`, {
  url: 'https://example.com',
} satisfies URLSubmission);

// Render architecture text
console.log(result.architecture.title);

// Render diagram if URL is present
if (result.diagram?.url) {
  // Use in <img src="..." /> or Next <Image /> (ensure domain allowlist if needed)
  console.log('Diagram URL:', result.diagram.url);
}
```

### Call `/jobs` (submit + poll)

```ts
const apiBase = process.env.NEXT_PUBLIC_ARCHLENS_API_BASE!;

const created = await postJson<JobCreateResponse>(`${apiBase}/jobs`, {
  url: 'https://example.com',
} satisfies URLSubmission);

// Poll until DONE/FAILED
while (true) {
  const job = await fetch(`${apiBase}/jobs/${created.job_id}`).then(
    (r) => r.json() as Promise<JobGetResponse>
  );
  if (job.status === 'DONE') {
    // If inline result is present
    if (job.result?.architecture) console.log(job.result.architecture.title);
    break;
  }
  if (job.status === 'FAILED') {
    throw new Error(job.error_message ?? 'Job failed');
  }
  await new Promise((r) => setTimeout(r, 1500));
}
```

## Notes for production (App Runner)

- If requests are timing out, consider:
  - Increasing upstream timeouts (where possible), or
  - Moving “diagram generation” to an async job model (submit → poll/status), or
  - Ensuring diagram tooling is preinstalled in the image (so no runtime downloads).
