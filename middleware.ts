import { NextResponse, NextRequest } from "next/server";

function checkBasicAuth(request: NextRequest): boolean {
  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const base64 = authHeader.slice(6).trim();
  let decoded: string;
  try {
    decoded = atob(base64);
  } catch {
    return false;
  }

  const colonIndex = decoded.indexOf(":");
  if (colonIndex === -1) return false;
  const user = decoded.slice(0, colonIndex).trim();
  const pass = decoded.slice(colonIndex + 1).trim();

  const expectedUser = (process.env.BASIC_AUTH_USER ?? "").trim();
  const expectedPass = (process.env.BASIC_AUTH_PASSWORD ?? "").trim();

  // No auth configured = allow access
  if (!expectedUser || !expectedPass) return true;

  return user === expectedUser && pass === expectedPass;
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CDN Admin", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  // /public and /s are for sharing files publicly
  // /cdn requires auth (private file serving)
  const publicRoutes = ["/public", "/s"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(`${route}/`) || pathname === route,
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require basic auth
  if (!checkBasicAuth(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
