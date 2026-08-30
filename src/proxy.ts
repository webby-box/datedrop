import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const clerkReady = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

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

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req.nextUrl.pathname)) await auth.protect();
});

export default function proxy(req: NextRequest, evt: unknown) {
  if (!clerkReady) return NextResponse.next();
  return clerk(req, evt as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
