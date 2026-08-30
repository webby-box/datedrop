import { clerkConfigured } from "./env";
import { users } from "./models";

export type AppUser = {
  clerkId: string;
  email?: string;
  demo: boolean;
};

export async function currentUserSafe(): Promise<AppUser | null> {
  if (!clerkConfigured()) {
    return { clerkId: "demo-local", email: "demo@datedrop.local", demo: true };
  }
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const u = await currentUser();
    const email = u?.emailAddresses?.[0]?.emailAddress;
    const col = await users();
    await col.updateOne(
      { clerkId: userId },
      {
        $setOnInsert: { clerkId: userId, createdAt: new Date() },
        $set: { email },
      },
      { upsert: true },
    );
    return { clerkId: userId, email, demo: false };
  } catch (err) {
    console.error("Clerk auth failed", err);
    return null;
  }
}

export async function requireUser(): Promise<AppUser> {
  const u = await currentUserSafe();
  if (!u) {
    const error = new Error("UNAUTHENTICATED");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
  return u;
}
