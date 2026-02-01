import { CACHE_TTL } from "./constants";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  avif: "image/avif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  pdf: "application/pdf",
  json: "application/json",
  xml: "application/xml",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  mjs: "application/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  zip: "application/zip",
  gz: "application/gzip",
  tar: "application/x-tar",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  toml: "application/toml",
};

const DEFAULT_MIME_TYPE = "application/octet-stream";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|ico|avif|bmp|tiff)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac)$/i;
const FONT_EXTENSIONS = /\.(woff|woff2|ttf|otf|eot)$/i;
const DOCUMENT_EXTENSIONS = /\.(pdf|json|txt|md|csv|xml)$/i;
const STATIC_ASSET_EXTENSIONS = /\.(css|js|mjs)$/i;

export function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? DEFAULT_MIME_TYPE;
}

export function getCacheControl(contentType: string): string {
  if (
    contentType.startsWith("image/") ||
    contentType.startsWith("font/") ||
    contentType === "application/javascript" ||
    contentType === "text/css"
  ) {
    return `public, max-age=${CACHE_TTL.IMMUTABLE}, immutable`;
  }

  if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
    return `public, max-age=${CACHE_TTL.MEDIA}`;
  }

  if (
    contentType === "application/pdf" ||
    contentType === "application/json" ||
    contentType === "text/plain" ||
    contentType === "text/markdown"
  ) {
    return `public, max-age=${CACHE_TTL.DOCUMENT}`;
  }

  return `public, max-age=${CACHE_TTL.DEFAULT}`;
}

export function isImage(path: string): boolean {
  return IMAGE_EXTENSIONS.test(path);
}

export function isVideo(path: string): boolean {
  return VIDEO_EXTENSIONS.test(path);
}

export function isAudio(path: string): boolean {
  return AUDIO_EXTENSIONS.test(path);
}

export function isFont(path: string): boolean {
  return FONT_EXTENSIONS.test(path);
}

export function isDocument(path: string): boolean {
  return DOCUMENT_EXTENSIONS.test(path);
}

export function isStaticAsset(path: string): boolean {
  return STATIC_ASSET_EXTENSIONS.test(path);
}

export function resolveContentType(
  metadataType: string | undefined,
  path: string,
): string {
  if (metadataType && metadataType !== DEFAULT_MIME_TYPE) {
    return metadataType;
  }
  return getContentType(path);
}
