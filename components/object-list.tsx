/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */

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
import { createLink } from "@/lib/api";

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

const CopyIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
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

const LinkIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
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
  const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(
    new Set(),
  );
  const [previewItem, setPreviewItem] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const [creatingLinkKey, setCreatingLinkKey] = useState<string | null>(null);
  const [linkCreatedKey, setLinkCreatedKey] = useState<string | null>(null);

  const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL ?? "";
  // Ensure CDN URL has protocol
  const cdnUrl = rawCdnUrl && !rawCdnUrl.startsWith("http") 
    ? `https://${rawCdnUrl}` 
    : rawCdnUrl;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "";
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

  async function createShortLink(key: string) {
    const url = getAssetUrl(key);
    if (!url) return;

    setCreatingLinkKey(key);
    setOpenMenuKey(null);

    try {
      const link = await createLink(url);
      const shortUrl = adminUrl
        ? `${adminUrl.replace(/\/$/, "")}/s/${link.shortCode}`
        : `/s/${link.shortCode}`;
      await navigator.clipboard.writeText(shortUrl);
      setLinkCreatedKey(key);
      setTimeout(() => setLinkCreatedKey(null), 3000);
    } catch (err) {
      console.error("Failed to create short link:", err);
      alert(err instanceof Error ? err.message : "Failed to create short link");
    } finally {
      setCreatingLinkKey(null);
    }
  }

  function openPreview(key: string, url: string) {
    setPreviewItem({ key, url });
  }

  function closePreview() {
    setPreviewItem(null);
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
        <table className="w-full min-w-[800px] text-left text-sm">
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
              <th scope="col" className="min-w-[180px] px-6 py-3 font-medium text-right">
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
              const showPreview =
                isImg && assetUrl && !failedImageKeys.has(key);

              function handleRowClick() {
                if (assetUrl && !isEditing) {
                  window.open(assetUrl, "_blank", "noopener,noreferrer");
                }
              }

              return (
                <tr
                  key={key}
                  className={`hover:bg-zinc-800/50 ${assetUrl && !isEditing ? "cursor-pointer" : ""}`}
                  onClick={handleRowClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && assetUrl && !isEditing) {
                      handleRowClick();
                    }
                  }}
                  tabIndex={assetUrl && !isEditing ? 0 : undefined}
                  role={assetUrl && !isEditing ? "link" : undefined}
                >
                  <td className="px-6 py-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-zinc-700 bg-zinc-800 ${showPreview ? "cursor-pointer hover:ring-2 hover:ring-blue-500" : ""}`}
                      onClick={(e) => {
                        if (showPreview) {
                          e.stopPropagation();
                          openPreview(key, assetUrl);
                        }
                      }}
                      role={showPreview ? "button" : undefined}
                      tabIndex={showPreview ? 0 : undefined}
                      onKeyDown={
                        showPreview
                          ? (e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                openPreview(key, assetUrl);
                              }
                            }
                          : undefined
                      }
                    >
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
                        onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => e.stopPropagation()}
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
                      <div className="flex justify-end gap-2 whitespace-nowrap">
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
                      <div className="relative flex items-center justify-end gap-2 whitespace-nowrap">
                        {linkCreatedKey === key && (
                          <span className="text-xs font-medium text-green-400 whitespace-nowrap">Link copied!</span>
                        )}
                        {copiedKey === key && !linkCreatedKey && (
                          <span className="text-xs font-medium text-green-400 whitespace-nowrap">URL copied!</span>
                        )}
                        {cdnUrl && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void createShortLink(key);
                              }}
                              disabled={creatingLinkKey === key}
                              className="rounded-md border border-zinc-600 bg-zinc-700/50 p-2 text-zinc-200 transition-colors hover:border-blue-500 hover:bg-blue-600/20 hover:text-blue-400 disabled:opacity-50 shrink-0"
                              title="Create short link"
                              aria-label="Create short link"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyUrl(key);
                              }}
                              className="rounded-md border border-zinc-600 bg-zinc-700/50 p-2 text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-600 hover:text-white shrink-0"
                              title="Copy URL"
                              aria-label="Copy URL"
                            >
                              <CopyIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuKey(openMenuKey === key ? null : key);
                            }}
                            className="rounded-md border border-zinc-600 bg-zinc-700/50 p-2 text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-600 hover:text-white"
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
                              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-zinc-600 bg-zinc-800 py-1 shadow-xl">
                                {cdnUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void createShortLink(key);
                                    }}
                                    disabled={creatingLinkKey === key}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                    {creatingLinkKey === key
                                      ? "Creating…"
                                      : linkCreatedKey === key
                                        ? "Link copied!"
                                        : "Create Short Link"}
                                  </button>
                                )}
                                {cdnUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void copyUrl(key);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700"
                                  >
                                    <CopyIcon className="h-4 w-4" />
                                    Copy URL
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(key);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
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

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={closePreview}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
            <img
              src={previewItem.url}
              alt={getFileName(previewItem.key)}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 flex items-center justify-between gap-4 rounded-lg bg-zinc-900/90 px-4 py-2">
              <span className="truncate font-mono text-sm text-zinc-300">
                {previewItem.key}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyUrl(previewItem.key);
                  }}
                  className="rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
                >
                  {copiedKey === previewItem.key ? "Copied!" : "Copy URL"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void createShortLink(previewItem.key);
                  }}
                  disabled={creatingLinkKey === previewItem.key}
                  className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {creatingLinkKey === previewItem.key
                    ? "Creating…"
                    : linkCreatedKey === previewItem.key
                      ? "Link copied!"
                      : "Create Short Link"}
                </button>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
                >
                  Open
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
