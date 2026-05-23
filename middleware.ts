import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PAGES = new Set(["/login", "/register"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/register", "/api/health"];

function isPublicApi(path: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => path.startsWith(p));
}

export default auth((req) => {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api")) {
    if (isPublicApi(path)) {
      return;
    }
    if (!req.auth) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    return;
  }

  if (req.auth && PUBLIC_PAGES.has(path)) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }

  if (PUBLIC_PAGES.has(path)) {
    return;
  }

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
