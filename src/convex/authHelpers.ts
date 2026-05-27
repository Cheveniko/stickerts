import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "./_generated/server";

type AuthCtx = Pick<QueryCtx, "auth" | "db">;

export async function getCurrentAuthUserId(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const sessionId = await getAuthSessionId(ctx);
  if (!sessionId) {
    return null;
  }

  const session = await ctx.db.get(sessionId);
  if (!session || session.expirationTime < Date.now()) {
    return null;
  }

  if (session.userId !== userId) {
    return null;
  }

  return userId;
}

export async function requireAuthUserId(ctx: AuthCtx) {
  const userId = await getCurrentAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError({
      code: "AUTHENTICATION_REQUIRED",
      message: "Debes iniciar sesion para hacer esto.",
    });
  }

  return userId;
}
