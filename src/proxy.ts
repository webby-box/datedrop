import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { googleAuthConfigured } from "@/lib/env";

const PREFIXES = [
  "/inbox",
  "/captures",
  "/boards",
  "/places",
  "/settings",
  "/api/captures",
  "/api/boards",
  "/api/places",
  "/api/settings",
];

function isProtected(pathname: string) {
  return PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

const withAuth = auth((req) => {
  if (isProtected(req.nextUrl.pathname) && !req.auth) {
    const signIn = new URL("/sign-in", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

export default function proxy(req: NextRequest, evt: unknown) {
  // Demo-local mode: Google OAuth env missing → allow through.
  if (!googleAuthConfigured()) return NextResponse.next();
  return withAuth(req, evt as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
