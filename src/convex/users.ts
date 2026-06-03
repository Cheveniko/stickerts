import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { t } from "./messages";
import { getCurrentAuthUserId, requireAuthUserId } from "./authHelpers";
import { getCurrentSellerByUserId, type CurrentSeller } from "./sellers";

export type User = Doc<"users">;
export type CurrentUserData = { user: User; seller: CurrentSeller | null };

const maxNameLength = 50;

function normalizeName(name: string) {
  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new ConvexError({
      code: "INVALID_NAME",
      message: t(undefined, "error_invalid_name"),
    });
  }

  if (normalizedName.length > maxNameLength) {
    throw new ConvexError({
      code: "INVALID_NAME",
      message: t(undefined, "error_invalid_name"),
    });
  }

  return normalizedName;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const seller = await getCurrentSellerByUserId(ctx, userId);

    return { user, seller } satisfies CurrentUserData;
  },
});

export const updateCurrentUserName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const name = normalizeName(args.name);

    await ctx.db.patch(userId, { name });
  },
});
