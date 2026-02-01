import { NextRequest, NextResponse } from "next/server";
import { getLink } from "@/lib/d1";
import { getObject } from "@/lib/r2";
import { fileResponse } from "@/lib/http";
import { CACHE_TTL } from "@/lib/constants";

function isCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

    if (cdnUrl) {
      const cdnParsed = new URL(cdnUrl);
      return parsed.hostname === cdnParsed.hostname;
    }

    return (
      parsed.hostname.includes("cdn.") || parsed.pathname.startsWith("/cdn/")
    );
  } catch {
    return false;
  }
}

function extractR2Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(/^\//, "");

    if (path.startsWith("cdn/")) {
      path = path.substring(4);
    }

    return path || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await params;
  const code =
    typeof shortCode === "string" ? decodeURIComponent(shortCode) : "";

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  try {
    const link = await getLink(code);

    if (!link?.longUrl) {
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    if (isCdnUrl(link.longUrl)) {
      const r2Key = extractR2Key(link.longUrl);

      if (r2Key) {
        const object = await getObject(r2Key);

        if (object) {
          return fileResponse({
            body: object.body as BodyInit,
            contentType: object.contentType,
            contentLength: object.contentLength,
            etag: object.etag,
            path: r2Key,
            cacheControl: `public, max-age=${CACHE_TTL.IMMUTABLE}, immutable`,
          });
        }

        return NextResponse.redirect(new URL("/", request.url), 302);
      }
    }

    return NextResponse.redirect(link.longUrl, 307);
  } catch (err) {
    console.error("Short link error:", err);
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
}
