import { NextResponse } from "next/server";
import { CORS_HEADERS, CORS_PREFLIGHT_HEADERS } from "./constants";
import { getCacheControl, resolveContentType } from "./mime";

export interface ApiError {
  error: string;
  code?: string;
}

export function errorResponse(
  message: string,
  status: number,
  code?: string,
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status },
  );
}

export function badRequest(message: string): NextResponse<ApiError> {
  return errorResponse(message, 400);
}

export function notFound(message = "Not found"): NextResponse<ApiError> {
  return errorResponse(message, 404);
}

export function serverError(
  error: unknown,
  fallbackMessage = "Internal server error",
): NextResponse<ApiError> {
  const message = error instanceof Error ? error.message : fallbackMessage;
  return errorResponse(message, 500);
}

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export interface FileResponseOptions {
  body: BodyInit;
  contentType: string;
  contentLength: number;
  etag: string;
  path?: string;
  cacheControl?: string;
}

export function fileResponse(options: FileResponseOptions): NextResponse {
  const { body, contentType, contentLength, etag, path, cacheControl } =
    options;

  const resolvedContentType = path
    ? resolveContentType(contentType, path)
    : contentType;

  const headers = new Headers({
    "Content-Type": resolvedContentType,
    "Content-Length": String(contentLength),
    "Cache-Control": cacheControl ?? getCacheControl(resolvedContentType),
    ETag: etag,
    ...CORS_HEADERS,
  });

  return new NextResponse(body, { status: 200, headers });
}

export function notModifiedResponse(etag: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      ETag: etag,
      ...CORS_HEADERS,
    },
  });
}

export function headResponse(
  options: Omit<FileResponseOptions, "body">,
): NextResponse {
  const { contentType, contentLength, etag, path, cacheControl } = options;

  const resolvedContentType = path
    ? resolveContentType(contentType, path)
    : contentType;

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": resolvedContentType,
      "Content-Length": String(contentLength),
      "Cache-Control": cacheControl ?? getCacheControl(resolvedContentType),
      ETag: etag,
      ...CORS_HEADERS,
    },
  });
}

export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_PREFLIGHT_HEADERS,
  });
}

export function decodePathSegments(
  segments: string[] | undefined,
): string | null {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return null;
  }
  try {
    return segments.map((s) => decodeURIComponent(s)).join("/");
  } catch {
    return segments.join("/");
  }
}

export function isValidPath(path: string): boolean {
  return !path.includes("..") && !path.startsWith("/");
}
