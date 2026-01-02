"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createJob } from "@/lib/archlens/client";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_ARCHLENS_API_BASE ?? "",
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await createJob({ url: url.trim() });
      router.push(`/jobs/${created.job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">ArchLens</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Submit a URL to ArchLens <code>/jobs</code>, then we’ll poll until
            the result is ready (text + diagram).
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            API base:{" "}
            <code data-testid="api-base">
              {apiBase || "(missing NEXT_PUBLIC_ARCHLENS_API_BASE)"}
            </code>
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Website URL</span>
            <input
              data-testid="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.acciona-energia.com/"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </label>

          {error ? (
            <p
              data-testid="submit-error"
              className="mt-3 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <button
              data-testid="submit-button"
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
            >
              {isSubmitting ? "Submitting…" : "Generate diagram (via /jobs)"}
            </button>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              We do not call any <code>/generate-*</code> endpoints.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
