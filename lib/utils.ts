export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function normalizeKey(key: string): string {
  return key.replace(/^\//, "").trim();
}

export function isValidKey(key: string): boolean {
  return key.length > 0 && !key.includes("..");
}

export function getFolderFromKey(key: string): string {
  const i = key.lastIndexOf("/");
  return i === -1 ? "" : key.slice(0, i);
}

export function getFileName(key: string): string {
  const i = key.lastIndexOf("/");
  return i === -1 ? key : key.slice(i + 1);
}

export function getExtension(key: string): string {
  const name = getFileName(key);
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}
