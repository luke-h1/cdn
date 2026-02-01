"use client";

import { useState, useEffect, useCallback } from "react";
import type { LinkRecord } from "@/lib/api";
import { fetchLinks, createLink, deleteLink } from "@/lib/api";

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function LinkShortener() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [longUrl, setLongUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLinks();
      setLinks(data.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load links");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = longUrl.trim();
    if (!url) return;
    setSubmitting(true);
    setError(null);
    try {
      await createLink(url, shortCode.trim() || undefined);
      setLongUrl("");
      setShortCode("");
      await loadLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Delete short link /s/${code}?`)) return;
    setDeletingCode(code);
    setError(null);
    try {
      await deleteLink(code);
      await loadLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingCode(null);
    }
  }

  async function copyShortUrl(code: string) {
    const url = `${baseUrl}/s/${encodeURIComponent(code)}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <section
      className="mb-8 rounded-xl border border-zinc-700 bg-zinc-900/50 p-6"
      aria-labelledby="links-heading"
    >
      <h2 id="links-heading" className="mb-4 text-sm font-medium text-zinc-400">
        Link shortener
      </h2>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="longUrl" className="mb-1 block text-xs text-zinc-500">
            Long URL
          </label>
          <input
            id="longUrl"
            type="url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="https://example.com/page"
            required
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-40">
          <label htmlFor="shortCode" className="mb-1 block text-xs text-zinc-500">
            Short code (optional)
          </label>
          <input
            id="shortCode"
            type="text"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
            placeholder="my-link"
            pattern="[a-zA-Z0-9_-]{0,64}"
            title="Letters, numbers, underscore, hyphen; max 64 chars"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Shorten"}
        </button>
      </form>
      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading links…</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-zinc-500">No short links yet.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const shortUrl = `${baseUrl}/s/${encodeURIComponent(link.shortCode)}`;
            return (
              <li
                key={link.shortCode}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-400 hover:underline"
                  >
                    {shortUrl}
                  </a>
                  <p className="mt-0.5 truncate text-xs text-zinc-500" title={link.longUrl}>
                    → {link.longUrl}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(link.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyShortUrl(link.shortCode)}
                    className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    title={copiedCode === link.shortCode ? "Copied!" : "Copy short URL"}
                  >
                    <CopyIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.shortCode)}
                    disabled={deletingCode === link.shortCode}
                    className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 disabled:opacity-50"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
