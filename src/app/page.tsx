"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createJob } from "@/lib/archlens/client";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-12">
        <header className="flex flex-col items-center gap-2 text-center">
          <img
            src="/icon.png"
            alt="ArchLens"
            className="h-20 w-auto"
          />
          <h1 className="text-5xl font-semibold tracking-tight">ArchLens</h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Generate an AWS architecture brief and diagram from any public website.
          </p>
        </header>

        <form onSubmit={onSubmit} className="w-full">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <input
              data-testid="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a website URL…"
              className="h-12 w-full rounded-full border border-zinc-200 bg-white px-5 text-sm outline-none placeholder:text-zinc-400 shadow-sm focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              data-testid="submit-button"
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white shadow-sm disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
            >
              {isSubmitting ? "Working…" : "Generate"}
            </button>
          </div>

          {error ? (
            <p
              data-testid="submit-error"
              className="mt-3 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          ) : (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
              Tip: use a marketing homepage, docs site, or product landing page.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
