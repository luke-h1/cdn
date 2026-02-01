import { NextRequest } from "next/server";
import {
  listObjects,
  uploadObject,
  deleteObject,
  copyObject,
  headObject,
} from "@/lib/s3";
import {
  badRequest,
  notFound,
  serverError,
  jsonResponse,
  decodePathSegments,
  isValidPath,
  checkBasicAuth,
  unauthorizedResponse,
} from "@/lib/http";
import { LIMITS } from "@/lib/constants";

type RouteParams = { params: Promise<{ key?: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  const key = decodePathSegments((await params).key);

  if (!key) {
    try {
      const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
      const maxKeys = Math.min(
        parseInt(
          request.nextUrl.searchParams.get("maxKeys") ??
            String(LIMITS.DEFAULT_LIST_OBJECTS),
          10,
        ),
        LIMITS.MAX_LIST_OBJECTS,
      );

      const result = await listObjects(prefix, maxKeys);

      const items = (result.contents ?? []).map((obj) => ({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified:
          obj.LastModified instanceof Date
            ? obj.LastModified.toISOString()
            : (obj.LastModified ?? null),
      }));

      return jsonResponse({
        items,
        isTruncated: result.isTruncated,
        keyCount: result.keyCount,
      });
    } catch (err) {
      console.error("List objects error:", err);
      return serverError(err, "Failed to list objects");
    }
  }

  try {
    const meta = await headObject(key);
    return jsonResponse(meta);
  } catch (err) {
    console.error("Head object error:", err);
    return notFound();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  const keyFromParams = decodePathSegments((await params).key);

  if (keyFromParams) {
    return badRequest("POST to list only (no key in path)");
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let key: string;
    let body: Buffer;
    let contentTypeHeader = "application/octet-stream";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const keyFromForm = formData.get("key");

      if (!file) {
        return badRequest("Missing file in form data");
      }

      key =
        (typeof keyFromForm === "string" ? keyFromForm.trim() : null) ||
        file.name;
      body = Buffer.from(await file.arrayBuffer());
      contentTypeHeader = file.type || "application/octet-stream";
    } else {
      const json = (await request.json().catch(() => null)) as {
        key?: string;
        body?: unknown;
      } | null;

      if (!json || typeof json.key !== "string") {
        return badRequest("JSON body must include key");
      }

      key = json.key;
      body = Buffer.from(
        typeof json.body === "string"
          ? json.body
          : JSON.stringify(json.body ?? ""),
      );
    }

    key = key.replace(/^\//, "").trim();

    if (!key || !isValidPath(key)) {
      return badRequest("Invalid key");
    }

    await uploadObject(key, body, contentTypeHeader);
    return jsonResponse({ key });
  } catch (err) {
    console.error("Upload error:", err);
    return serverError(err, "Upload failed");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  const key = decodePathSegments((await params).key);

  if (!key) {
    return badRequest("Missing key");
  }

  try {
    const body = (await request.json()) as { newKey?: string; key?: string };
    const newKey = body?.newKey ?? body?.key;

    if (typeof newKey !== "string" || !newKey || !isValidPath(newKey)) {
      return badRequest("Body must include newKey (string)");
    }

    await copyObject(key, newKey);
    return jsonResponse({ key: newKey });
  } catch (err) {
    console.error("Rename/copy error:", err);
    return serverError(err, "Update failed");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  const key = decodePathSegments((await params).key);

  if (!key) {
    return badRequest("Missing key");
  }

  try {
    await deleteObject(key);
    return jsonResponse({ deleted: key });
  } catch (err) {
    console.error("Delete error:", err);
    return serverError(err, "Delete failed");
  }
}
