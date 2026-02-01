import { NextRequest } from "next/server";
import { getLink, deleteLink } from "@/lib/d1";
import { badRequest, notFound, serverError, jsonResponse } from "@/lib/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const p = await params;
  const shortCode =
    typeof p?.shortCode === "string" ? decodeURIComponent(p.shortCode) : null;

  if (!shortCode) {
    return badRequest("Missing shortCode");
  }

  try {
    const link = await getLink(shortCode);

    if (!link) {
      return notFound();
    }

    return jsonResponse(link);
  } catch (err) {
    console.error("Get link error:", err);
    return serverError(err, "Failed to get link");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const p = await params;
  const shortCode =
    typeof p?.shortCode === "string" ? decodeURIComponent(p.shortCode) : null;

  if (!shortCode) {
    return badRequest("Missing shortCode");
  }

  try {
    await deleteLink(shortCode);
    return jsonResponse({ deleted: shortCode });
  } catch (err) {
    console.error("Delete link error:", err);
    return serverError(err, "Failed to delete link");
  }
}
