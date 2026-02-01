import { NextRequest } from "next/server";
import { putLinkOverwrite, listLinks } from "@/lib/dynamodb";
import {
  badRequest,
  serverError,
  jsonResponse,
  checkBasicAuth,
  unauthorizedResponse,
} from "@/lib/http";
import {
  SHORT_CODE_PATTERN,
  SHORT_CODE_CHARS,
  DEFAULT_SHORT_CODE_LENGTH,
} from "@/lib/constants";

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidShortCode(s: string): boolean {
  return SHORT_CODE_PATTERN.test(s);
}

function generateShortCode(length = DEFAULT_SHORT_CODE_LENGTH): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result +=
      SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return result;
}

export async function GET(request: NextRequest) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  try {
    const links = await listLinks();
    return jsonResponse({ links });
  } catch (err) {
    console.error("List links error:", err);
    return serverError(err, "Failed to list links");
  }
}

export async function POST(request: NextRequest) {
  if (!checkBasicAuth(request)) return unauthorizedResponse();
  try {
    const body = (await request.json()) as {
      longUrl?: string;
      shortCode?: string;
    };

    const longUrl =
      typeof body?.longUrl === "string" ? body.longUrl.trim() : "";
    let shortCode =
      typeof body?.shortCode === "string" ? body.shortCode.trim() : "";

    if (!longUrl || !isValidUrl(longUrl)) {
      return badRequest("Valid longUrl (http or https) is required");
    }

    if (!shortCode) {
      shortCode = generateShortCode();
    } else if (!isValidShortCode(shortCode)) {
      return badRequest(
        "shortCode must be 1–64 chars: letters, numbers, underscore, hyphen",
      );
    }

    const record = await putLinkOverwrite(shortCode, longUrl);
    return jsonResponse(record);
  } catch (err) {
    console.error("Create link error:", err);
    return serverError(err, "Failed to create link");
  }
}
