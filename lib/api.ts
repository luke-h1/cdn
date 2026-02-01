import type { ListObjectsResponse, ApiErrorResponse, LinkRecord } from "@/types/bucket";

const API_BASE = "/api/objects";

type FetchOptions = RequestInit & { credentials?: RequestCredentials };

async function handleResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T | ApiErrorResponse;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data as ApiErrorResponse).error
        : res.statusText;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchObjects(prefix = ""): Promise<ListObjectsResponse> {
  const url = prefix
    ? `${API_BASE}?prefix=${encodeURIComponent(prefix)}`
    : API_BASE;
  const res = await fetch(url, {
    credentials: "include",
  } as FetchOptions);
  return handleResponse<ListObjectsResponse>(res);
}

export async function uploadObject(
  file: File,
  key?: string,
): Promise<{ key: string }> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("key", key?.trim() || file.name);
  const res = await fetch(API_BASE, {
    method: "POST",
    body: formData,
    credentials: "include",
  } as FetchOptions);
  return handleResponse<{ key: string }>(res);
}

export async function uploadObjects(
  files: File[],
  destinationFolder: string,
): Promise<{ keys: string[] }> {
  const prefix = destinationFolder.trim().replace(/\/$/, "");
  const uploads = files.map((file) => {
    const key = prefix ? `${prefix}/${file.name}` : file.name;
    return uploadObject(file, key).then(() => key);
  });
  const keys = await Promise.all(uploads);
  return { keys };
}

export async function renameObject(
  oldKey: string,
  newKey: string,
): Promise<{ key: string }> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(oldKey)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newKey }),
    credentials: "include",
  } as FetchOptions);
  return handleResponse<{ key: string }>(res);
}

export async function deleteObject(key: string): Promise<{ deleted: string }> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    method: "DELETE",
    credentials: "include",
  } as FetchOptions);
  return handleResponse<{ deleted: string }>(res);
}

// Link shortener
export type { LinkRecord };

const LINKS_BASE = "/api/links";

export async function fetchLinks(): Promise<{ links: LinkRecord[] }> {
  const res = await fetch(LINKS_BASE, { credentials: "include" } as FetchOptions);
  return handleResponse<{ links: LinkRecord[] }>(res);
}

export async function createLink(
  longUrl: string,
  shortCode?: string,
): Promise<LinkRecord> {
  const res = await fetch(LINKS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ longUrl, shortCode: shortCode || undefined }),
    credentials: "include",
  } as FetchOptions);
  return handleResponse<LinkRecord>(res);
}

export async function deleteLink(shortCode: string): Promise<{ deleted: string }> {
  const res = await fetch(`${LINKS_BASE}/${encodeURIComponent(shortCode)}`, {
    method: "DELETE",
    credentials: "include",
  } as FetchOptions);
  return handleResponse<{ deleted: string }>(res);
}
