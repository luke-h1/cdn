import { NextRequest } from "next/server";
import { getObject } from "@/lib/s3";
import {
  badRequest,
  notFound,
  serverError,
  fileResponse,
  notModifiedResponse,
  headResponse,
  corsPreflightResponse,
  decodePathSegments,
  isValidPath,
} from "@/lib/http";
import { CACHE_TTL } from "@/lib/constants";

type RouteParams = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const path = decodePathSegments((await params).path);

  if (!path) {
    return badRequest("Path is required");
  }

  if (!isValidPath(path)) {
    return badRequest("Invalid path");
  }

  try {
    const object = await getObject(path);

    if (!object) {
      return notFound("File not found");
    }

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === object.etag) {
      return notModifiedResponse(object.etag);
    }

    return fileResponse({
      body: object.body as BodyInit,
      contentType: object.contentType,
      contentLength: object.contentLength,
      etag: object.etag,
      path,
      cacheControl: `public, max-age=${CACHE_TTL.DEFAULT}`,
    });
  } catch (err) {
    console.error("Public serve error:", err);
    return serverError(err, "Failed to serve file");
  }
}

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function HEAD(_request: NextRequest, { params }: RouteParams) {
  const path = decodePathSegments((await params).path);

  if (!path || !isValidPath(path)) {
    return new Response(null, { status: 400 });
  }

  try {
    const object = await getObject(path);

    if (!object) {
      return new Response(null, { status: 404 });
    }

    return headResponse({
      contentType: object.contentType,
      contentLength: object.contentLength,
      etag: object.etag,
      path,
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
