import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = new Set(["/login", "/register"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/register", "/api/health"];

function isPublicApi(path: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => path.startsWith(p));
}

function getJwtSecret(): string | undefined {
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const secret = getJwtSecret();
  const token = secret ? await getToken({ req, secret }) : null;

  if (path.startsWith("/api")) {
    if (isPublicApi(path)) {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (token && PUBLIC_PAGES.has(path)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (PUBLIC_PAGES.has(path)) {
    return NextResponse.next();
  }

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
