/**
 * Format byte count for display (e.g. "1.2 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Normalize object key: trim and strip leading slash. Rejects "..".
 */
export function normalizeKey(key: string): string {
  return key.replace(/^\//, "").trim();
}

export function isValidKey(key: string): boolean {
  return key.length > 0 && !key.includes("..");
}

/** Folder path from key (e.g. "general/team.webp" -> "general") */
export function getFolderFromKey(key: string): string {
  const i = key.lastIndexOf("/");
  return i === -1 ? "" : key.slice(0, i);
}

/** File name from key (e.g. "general/team.webp" -> "team.webp") */
export function getFileName(key: string): string {
  const i = key.lastIndexOf("/");
  return i === -1 ? key : key.slice(i + 1);
}

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/i;

export function isImageKey(key: string): boolean {
  return IMAGE_EXT.test(key);
}
