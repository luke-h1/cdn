"use client";

import { useState } from "react";
import type { BucketItem } from "@/types/bucket";
import {
  formatBytes,
  normalizeKey,
  isValidKey,
  getFolderFromKey,
  getFileName,
} from "@/lib/utils";
import { isImage } from "@/lib/mime";

interface ObjectListProps {
  items: BucketItem[];
  loading: boolean;
  onRename: (oldKey: string, newKey: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  deletingKey: string | null;
}

const FileIcon = () => (
  <svg
    className="h-8 w-8 text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CopyIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const DotsIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

export function ObjectList({
  items,
  loading,
  onRename,
  onDelete,
  deletingKey,
}: ObjectListProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(new Set());

  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL ?? "";
  const sectionTitle = "All assets";

  function getAssetUrl(key: string): string {
    if (!cdnUrl) return "";
    const base = cdnUrl.replace(/\/$/, "");
    return `${base}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
  }

  function markImageFailed(key: string) {
    setFailedImageKeys((prev) => new Set(prev).add(key));
  }

  function startEdit(key: string) {
    setEditingKey(key);
    setEditValue(key);
    setOpenMenuKey(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
  }

  async function saveRename(oldKey: string) {
    const newKey = normalizeKey(editValue);
    if (!newKey || newKey === oldKey || !isValidKey(newKey)) {
      cancelEdit();
      return;
    }
    await onRename(oldKey, newKey);
    cancelEdit();
  }

  function handleKeyDown(key: string, e: React.KeyboardEvent) {
    if (e.key === "Enter") void saveRename(key);
    else if (e.key === "Escape") cancelEdit();
  }

  async function copyUrl(key: string) {
    const url = getAssetUrl(key);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setOpenMenuKey(null);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (loading) {
    return (
      <section
        className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50"
        aria-label="Recent assets"
      >
        <div className="px-6 py-8 text-center text-zinc-500">Loading…</div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section
        className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50"
        aria-label="Recent assets"
      >
        <h2
          id="assets-heading"
          className="border-b border-zinc-700 px-6 py-4 text-sm font-medium text-zinc-400"
        >
          {sectionTitle} (0)
        </h2>
        <div className="px-6 py-8 text-center text-zinc-500">
          No assets yet. Upload files or change the destination folder.
        </div>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50"
      aria-labelledby="assets-heading"
    >
      <h2
        id="assets-heading"
        className="border-b border-zinc-700 px-6 py-4 text-sm font-medium text-zinc-400"
      >
        {sectionTitle} ({items.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-500">
              <th scope="col" className="w-16 px-6 py-3 font-medium">
                Type
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Name
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Folder
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Size
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Last Modified
              </th>
              <th scope="col" className="w-24 px-6 py-3 font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {items.map((item) => {
              const key = item.key ?? "";
              const isEditing = editingKey === key;
              const folder = getFolderFromKey(key);
              const fileName = getFileName(key);
              const isImg = isImage(key);
              const assetUrl = getAssetUrl(key);
              const showPreview = isImg && assetUrl && !failedImageKeys.has(key);

              return (
                <tr key={key} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-zinc-700 bg-zinc-800">
                      {showPreview ? (
                        <img
                          src={assetUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(key)}
                        />
                      ) : (
                        <FileIcon />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(key, e)}
                        className="w-full max-w-md rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="New key name"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono text-zinc-300">
                        {assetUrl ? (
                          <a
                            href={assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                          >
                            {fileName}
                            <ExternalLinkIcon />
                          </a>
                        ) : (
                          fileName
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">{folder || "—"}</td>
                  <td className="px-6 py-3 tabular-nums text-zinc-500">
                    {formatBytes(item.size)}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">
                    {item.lastModified ? (
                      <time dateTime={item.lastModified}>
                        {new Date(item.lastModified).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void saveRename(key)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-end gap-1">
                        {cdnUrl && (
                          <button
                            type="button"
                            onClick={() => void copyUrl(key)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            title={copiedKey === key ? "Copied!" : "Copy URL"}
                            aria-label={
                              copiedKey === key ? "Copied!" : "Copy URL"
                            }
                          >
                            <CopyIcon />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuKey(openMenuKey === key ? null : key)
                            }
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            aria-label="More actions"
                            aria-expanded={openMenuKey === key}
                          >
                            <DotsIcon />
                          </button>
                          {openMenuKey === key && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                aria-hidden
                                onClick={() => setOpenMenuKey(null)}
                              />
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-zinc-600 bg-zinc-800 py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    startEdit(key);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuKey(null);
                                    if (confirm(`Delete "${key}"?`))
                                      void onDelete(key);
                                  }}
                                  disabled={deletingKey === key}
                                  className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 disabled:opacity-50"
                                >
                                  {deletingKey === key ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
