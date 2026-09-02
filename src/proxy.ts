import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { googleAuthConfigured } from "@/lib/env";

/** Page routes only — APIs use requireUser and must not go through auth() body cloning. */
const PAGE_PREFIXES = [
  "/explore",
  "/vault",
  "/capture",
  "/plans",
  "/premium",
  "/alerts",
  "/concierge",
  "/inbox",
  "/captures",
  "/boards",
  "/places",
  "/settings",
];

function isProtectedPage(pathname: string) {
  if (pathname.startsWith("/api/")) return false;
  if (pathname === "/") return true;
  return PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

const withAuth = auth((req) => {
  if (isProtectedPage(req.nextUrl.pathname) && !req.auth) {
    const signIn = new URL("/sign-in", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

export default function proxy(req: NextRequest, evt: unknown) {
  // Skip auth wrapper entirely for API routes so POST bodies (FormData/JSON) are untouched.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (!googleAuthConfigured()) return NextResponse.next();
  return withAuth(req, evt as never);
}

export const config = {
  matcher: [
    "/((?!_next|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
