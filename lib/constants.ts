export const CACHE_TTL = {
  IMMUTABLE: 31536000,
  MEDIA: 604800,
  DOCUMENT: 86400,
  DEFAULT: 3600,
  CORS_PREFLIGHT: 86400,
} as const;

export const LIMITS = {
  MAX_LIST_OBJECTS: 1000,
  DEFAULT_LIST_OBJECTS: 500,
  MAX_SHORT_CODE_LENGTH: 64,
} as const;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers": "ETag",
} as const;

export const CORS_PREFLIGHT_HEADERS = {
  ...CORS_HEADERS,
  "Access-Control-Max-Age": String(CACHE_TTL.CORS_PREFLIGHT),
} as const;

export const SHORT_CODE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export const SHORT_CODE_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const DEFAULT_SHORT_CODE_LENGTH = 4;
