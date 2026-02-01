import { NextRequest, NextResponse } from "next/server";
import { getLink } from "@/lib/dynamodb";
import { getObject } from "@/lib/s3";
import { fileResponse, notFound } from "@/lib/http";
import { CACHE_TTL } from "@/lib/constants";

function isCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
    const cdnUrl =
      rawCdnUrl && !rawCdnUrl.startsWith("http")
        ? `https://${rawCdnUrl}`
        : rawCdnUrl;

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

function extractS3Key(url: string): string | null {
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
    return notFound("Missing short code");
  }

  try {
    const link = await getLink(code);

    if (!link?.longUrl) {
      return notFound("Short link not found");
    }

    // If the link points to our CDN, serve the file directly from S3
    if (isCdnUrl(link.longUrl)) {
      const s3Key = extractS3Key(link.longUrl);

      if (s3Key) {
        const object = await getObject(s3Key);

        if (object) {
          return fileResponse({
            body: object.body as BodyInit,
            contentType: object.contentType,
            contentLength: object.contentLength,
            etag: object.etag,
            path: s3Key,
            cacheControl: `public, max-age=${CACHE_TTL.IMMUTABLE}, immutable`,
          });
        }

        return notFound("File not found in storage");
      }
    }

    // Otherwise redirect to the long URL
    return NextResponse.redirect(link.longUrl, 307);
  } catch (err) {
    console.error("Short link error:", err);
    return notFound("Short link error");
  }
}
