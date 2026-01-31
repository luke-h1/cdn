import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function checkBasicAuth(request: NextRequest): boolean {
  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const base64 = authHeader.slice(6).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return false;
  }

  const colonIndex = decoded.indexOf(":");
  if (colonIndex === -1) return false;
  const user = decoded.slice(0, colonIndex).trim();
  const pass = decoded.slice(colonIndex + 1).trim();

  const expectedUser = (process.env.BASIC_AUTH_USER ?? "").trim();
  const expectedPass = (process.env.BASIC_AUTH_PASSWORD ?? "").trim();

  if (!expectedUser || !expectedPass) return false;
  return user === expectedUser && pass === expectedPass;
}

export function proxy(request: NextRequest) {
  if (checkBasicAuth(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CDN Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/", "/api/objects/:path*"],
};
