import { NextRequest, NextResponse } from "next/server";
import {
  listObjects,
  uploadObject,
  deleteObject,
  copyObject,
  headObject,
} from "@/lib/s3";

function getKeyFromParams(params: { key?: string[] }): string | null {
  const key = params.key;
  if (!key || !Array.isArray(key) || key.length === 0) return null;
  try {
    return key.map((s) => decodeURIComponent(s)).join("/");
  } catch {
    return key.join("/");
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key?: string[] }> }
) {
  const key = getKeyFromParams(await params);

  if (!key) {
    try {
      const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
      const maxKeys = Math.min(
        parseInt(request.nextUrl.searchParams.get("maxKeys") ?? "500", 10),
        1000
      );
      const result = await listObjects(prefix, maxKeys);
      const items = (result.contents ?? []).map((o) => ({
        key: o.Key,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? null,
      }));
      return NextResponse.json({
        items,
        isTruncated: result.isTruncated,
        keyCount: result.keyCount,
      });
    } catch (err) {
      console.error("List objects error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to list objects" },
        { status: 500 }
      );
    }
  }

  try {
    const meta = await headObject(key);
    return NextResponse.json(meta);
  } catch (err) {
    console.error("Head object error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key?: string[] }> }
) {
  const keyFromParams = getKeyFromParams(await params);
  if (keyFromParams) {
    return NextResponse.json(
      { error: "POST to list only (no key in path)" },
      { status: 400 }
    );
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
      key =
        (typeof keyFromForm === "string" ? keyFromForm.trim() : null) ||
        (file?.name ?? "upload");
      if (!file) {
        return NextResponse.json(
          { error: "Missing file in form data" },
          { status: 400 }
        );
      }
      body = Buffer.from(await file.arrayBuffer());
      if (file.type) contentTypeHeader = file.type;
    } else {
      const json = await request.json().catch(() => null);
      if (!json || typeof json.key !== "string") {
        return NextResponse.json(
          { error: "JSON body must include key" },
          { status: 400 }
        );
      }
      key = json.key;
      body = Buffer.from(
        typeof json.body === "string"
          ? json.body
          : JSON.stringify(json.body ?? "")
      );
      contentTypeHeader =
        request.headers.get("content-type") ?? contentTypeHeader;
    }

    key = key.replace(/^\//, "").trim();
    if (!key || key.includes("..")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    await uploadObject(key, body, contentTypeHeader);
    return NextResponse.json({ key });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key?: string[] }> }
) {
  const key = getKeyFromParams(await params);
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const newKey = body?.newKey ?? body?.key;
    if (typeof newKey !== "string" || !newKey || newKey.includes("..")) {
      return NextResponse.json(
        { error: "Body must include newKey (string)" },
        { status: 400 }
      );
    }
    await copyObject(key, newKey);
    return NextResponse.json({ key: newKey });
  } catch (err) {
    console.error("Rename/copy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key?: string[] }> }
) {
  const key = getKeyFromParams(await params);
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  try {
    await deleteObject(key);
    return NextResponse.json({ deleted: key });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
