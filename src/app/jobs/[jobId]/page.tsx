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

function formatUrlHost(urlString: string | null | undefined): string | null {
  if (!urlString) return null;
  try {
    return new URL(urlString).host;
  } catch {
    return urlString;
  }
}

function Section({
  title,
  children,
  subtle,
}: {
  title: string;
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 ${
        subtle
          ? "border-zinc-100 dark:border-zinc-900"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
      {items.map((x, idx) => (
        <li key={`${idx}-${x.slice(0, 16)}`} className="whitespace-pre-wrap">
          {x}
        </li>
      ))}
    </ul>
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
  const inputHost = formatUrlHost(job?.input_url);

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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                {inputHost ? inputHost : "Architecture result"}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {job?.status === "DONE" && job.result?.architecture?.title
                  ? job.result.architecture.title
                  : "Generating architecture…"}
              </h1>
            </div>
            <Link
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              href="/"
            >
              New
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span data-testid="job-status">
              <StatusPill status={job?.status ?? "QUEUED"} />
            </span>
            {job?.created_at ? (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Created{" "}
                <span className="font-mono text-xs">{job.created_at}</span>
              </span>
            ) : null}
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              <span className="sr-only">Job id</span>
              <code data-testid="job-id">{jobId}</code>
            </span>
            {shouldPoll ? (
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                Updating…
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
          <Section title="Couldn’t generate this architecture" subtle>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {job.error_message ?? "Unknown error"}
            </p>
          </Section>
        ) : null}

        {job && job.status !== "DONE" && job.status !== "FAILED" ? (
          <Section title="Working…">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              This can take a minute or two depending on the site.
            </p>
          </Section>
        ) : null}

        {job?.status === "DONE" && job.result?.architecture ? (
          <>
            <Section title="Summary">
              <p
                data-testid="arch-summary"
                className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300"
              >
                {job.result.architecture.summary}
              </p>
            </Section>

            <Section title="Diagram">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Reference diagram generated for this site.
                </p>
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
                    alt="AWS architecture diagram"
                    className="h-auto w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p data-testid="diagram-missing">
                    Diagram image URL wasn’t available for this run.
                  </p>
                  {diagramS3Uri ? (
                    <p>
                      Diagram S3 URI: <code>{diagramS3Uri}</code>
                    </p>
                  ) : null}
                  {diagramCodeS3Uri ? (
                    <p>
                      Diagram code S3 URI: <code>{diagramCodeS3Uri}</code>
                    </p>
                  ) : null}
                </div>
              )}
            </Section>

            <Section title="How it works (data flow)">
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {job.result.architecture.data_flow}
              </p>
            </Section>

            <Section title="Reasoning (functional)">
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {job.result.architecture.functional_reasoning}
              </p>
            </Section>

            <Section title="Reasoning (non-functional)">
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {job.result.architecture.non_functional_reasoning}
              </p>
            </Section>

            <Section title="Components">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 dark:text-zinc-500">
                      <th className="border-b border-zinc-200 pb-2 pr-4 font-medium dark:border-zinc-800">
                        Service
                      </th>
                      <th className="border-b border-zinc-200 pb-2 pr-4 font-medium dark:border-zinc-800">
                        Role
                      </th>
                      <th className="border-b border-zinc-200 pb-2 font-medium dark:border-zinc-800">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-700 dark:text-zinc-300">
                    {job.result.architecture.components.map((c) => (
                      <tr key={`${c.name}-${c.role}`}>
                        <td className="border-b border-zinc-100 py-3 pr-4 align-top dark:border-zinc-900">
                          {c.name}
                        </td>
                        <td className="border-b border-zinc-100 py-3 pr-4 align-top dark:border-zinc-900">
                          {c.role}
                        </td>
                        <td className="border-b border-zinc-100 py-3 align-top dark:border-zinc-900">
                          {c.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Assumptions">
              <Bullets items={job.result.architecture.assumptions} />
            </Section>

            <Section title="Key tradeoffs">
              <Bullets items={job.result.architecture.key_tradeoffs} />
            </Section>

            <Section title="Benefits">
              <Bullets items={job.result.architecture.benefits} />
            </Section>
          </>
        ) : null}
      </main>
    </div>
  );
}


