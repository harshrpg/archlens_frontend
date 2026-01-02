import type {
  FastApiError,
  JobCreateResponse,
  JobGetResponse,
  URLSubmission,
} from "./types";

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_ARCHLENS_API_BASE;
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_ARCHLENS_API_BASE (e.g. http://127.0.0.1:8000)"
    );
  }
  return base.replace(/\/+$/, "");
}

async function readErrorDetail(res: Response): Promise<string | null> {
  const data = (await res.json().catch(() => null)) as FastApiError | null;
  return data?.detail ?? null;
}

export async function createJob(body: URLSubmission): Promise<JobCreateResponse> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new Error(detail ?? `POST /jobs failed: ${res.status}`);
  }

  return (await res.json()) as JobCreateResponse;
}

export async function getJob(jobId: string): Promise<JobGetResponse> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new Error(detail ?? `GET /jobs/${jobId} failed: ${res.status}`);
  }

  return (await res.json()) as JobGetResponse;
}


