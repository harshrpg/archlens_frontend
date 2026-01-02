"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getJob } from "@/lib/archlens/client";
import type { JobGetResponse, JobStatus } from "@/lib/archlens/types";

function StatusPill({ status }: { status: JobStatus }) {
  const styles =
    status === "DONE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "FAILED"
        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

export default function JobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const [job, setJob] = useState<JobGetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diagramUrl = job?.result?.diagram?.url ?? null;
  const diagramS3Uri = job?.result?.diagram?.s3_uri ?? null;
  const diagramCodeS3Uri = job?.diagram_code_s3_uri ?? null;

  const shouldPoll = useMemo(() => {
    return job?.status === "QUEUED" || job?.status === "RUNNING" || job === null;
  }, [job]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const next = await getJob(jobId);
        if (cancelled) return;
        setJob(next);
        setError(null);

        if (next.status === "QUEUED" || next.status === "RUNNING") {
          timer = setTimeout(tick, 1500);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        timer = setTimeout(tick, 3000);
      }
    }

    // start polling immediately
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Job</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  ID:
                </span>{" "}
                <code data-testid="job-id">{jobId}</code>
              </p>
            </div>
            <Link
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              href="/"
            >
              New job
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Status:
            </span>
            <span data-testid="job-status">
              <StatusPill status={job?.status ?? "QUEUED"} />
            </span>
            {shouldPoll ? (
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                Polling…
              </span>
            ) : null}
          </div>

          {error ? (
            <p
              data-testid="job-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          ) : null}
        </header>

        {job?.status === "FAILED" ? (
          <section className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Job failed</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {job.error_message ?? "Unknown error"}
            </p>
          </section>
        ) : null}

        {job?.status === "DONE" && job.result?.architecture ? (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2
                data-testid="arch-title"
                className="text-xl font-semibold tracking-tight"
              >
                {job.result.architecture.title}
              </h2>
              <p
                data-testid="arch-summary"
                className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300"
              >
                {job.result.architecture.summary}
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Diagram</h2>
                {diagramUrl ? (
                  <a
                    className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                    href={diagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="diagram-open-link"
                  >
                    Open image
                  </a>
                ) : null}
              </div>

              {diagramUrl ? (
                <div className="mt-4">
                  <img
                    data-testid="diagram-image"
                    src={diagramUrl}
                    alt="ArchLens diagram"
                    className="h-auto w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p data-testid="diagram-missing">
                    No browser-renderable diagram URL was provided for this job.
                  </p>
                  {diagramS3Uri ? (
                    <p>
                      S3 URI: <code>{diagramS3Uri}</code>
                    </p>
                  ) : null}
                  {diagramCodeS3Uri ? (
                    <p>
                      Diagram code S3 URI: <code>{diagramCodeS3Uri}</code>
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          </>
        ) : null}

        {job && job.status !== "DONE" && job.status !== "FAILED" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Working…</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              We’ll keep polling until the job is DONE. If your backend is down,
              you’ll see an error above.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}


