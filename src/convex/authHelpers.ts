import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "./_generated/server";

type AuthCtx = Pick<QueryCtx, "auth">;

export async function getCurrentAuthUserId(ctx: AuthCtx) {
  return await getAuthUserId(ctx);
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
