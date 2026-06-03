import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import * as m from "../lib/paraglide/messages.js";
import { getCurrentAuthUserId, requireAuthUserId } from "./authHelpers";
import { messageOptions } from "./i18n";
import { getCurrentSellerByUserId, type CurrentSeller } from "./sellers";

export type User = Doc<"users">;
export type CurrentUserData = { user: User; seller: CurrentSeller | null };

const maxNameLength = 50;

function normalizeName(name: string) {
  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new ConvexError({
      code: "INVALID_NAME",
      message: m.error_invalid_name({}, messageOptions()),
    });
  }

  if (normalizedName.length > maxNameLength) {
    throw new ConvexError({
      code: "INVALID_NAME",
      message: m.error_invalid_name({}, messageOptions()),
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
