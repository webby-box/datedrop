import { googleAuthConfigured } from "./env";
import { mongoConfigured } from "./mongodb";
import { users } from "./models";

export type AppUser = {
  userId: string;
  email?: string;
  demo: boolean;
};

export async function currentUserSafe(): Promise<AppUser | null> {
  if (!googleAuthConfigured()) {
    return { userId: "demo-local", email: "demo@datedrop.local", demo: true };
  }
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;
    const email = session.user?.email ?? undefined;
    if (mongoConfigured()) {
      const col = await users();
      await col.updateOne(
        { userId },
        {
          $setOnInsert: { userId, createdAt: new Date() },
          $set: { email },
        },
        { upsert: true },
      );
    }
    return { userId, email, demo: false };
  } catch (err) {
    console.error("Google auth failed", err);
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
