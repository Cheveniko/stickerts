import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getCurrentAuthUserId, requireAuthUserId } from "./authHelpers";
import { getCityBySlug, type City } from "./cities";

export type Seller = Doc<"sellers">;
export type CurrentSeller = Seller & { city: City | null };

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
const DEFAULT_CURRENCY_REGEX = /^[A-Z]{3}$/;

type SellerDbCtx = Pick<QueryCtx, "db">;

async function getSellerByUserId(ctx: SellerDbCtx, userId: Seller["userId"]) {
  return await ctx.db
    .query("sellers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function getCurrentSellerByUserId(
  ctx: SellerDbCtx,
  userId: Seller["userId"],
): Promise<CurrentSeller | null> {
  const seller = await getSellerByUserId(ctx, userId);

  if (!seller) return null;

  const city = seller.defaultCitySlug
    ? await getCityBySlug(ctx, seller.defaultCitySlug)
    : null;

  return { ...seller, city };
}

async function requireCurrentSeller(
  ctx: SellerDbCtx,
  userId: Seller["userId"],
) {
  const seller = await getSellerByUserId(ctx, userId);

  if (!seller) {
    throw new ConvexError({
      code: "SELLER_NOT_FOUND",
      message: "No encontramos un seller para este usuario.",
    });
  }

  return seller;
}

function normalizeUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    throw new ConvexError({
      code: "INVALID_USERNAME",
      message:
        "El username debe tener entre 3 y 30 caracteres y solo puede usar letras, numeros y guion bajo.",
    });
  }

  return normalizedUsername;
}

function normalizeCurrency(currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (!DEFAULT_CURRENCY_REGEX.test(normalizedCurrency)) {
    throw new ConvexError({
      code: "INVALID_DEFAULT_CURRENCY",
      message: "La moneda debe ser un codigo ISO de 3 letras.",
    });
  }

  return normalizedCurrency;
}

export const getCurrentSeller = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentAuthUserId(ctx);
    if (!userId) return null;

    return await getCurrentSellerByUserId(ctx, userId);
  },
});

export const updateCurrentSellerUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const username = normalizeUsername(args.username);

    const existingSeller = await ctx.db
      .query("sellers")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existingSeller && existingSeller._id !== seller._id) {
      throw new ConvexError({
        code: "USERNAME_TAKEN",
        message: "Este username ya esta en uso.",
      });
    }

    await ctx.db.patch(seller._id, { username });
  },
});

export const updateCurrentSellerDefaultCurrency = mutation({
  args: {
    defaultCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const defaultCurrency = normalizeCurrency(args.defaultCurrency);

    await ctx.db.patch(seller._id, { defaultCurrency });
  },
});

export const updateCurrentSellerDefaultCity = mutation({
  args: {
    citySlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const city = await getCityBySlug(ctx, args.citySlug);

    if (!city) {
      throw new ConvexError({
        code: "CITY_NOT_FOUND",
        message: "No encontramos la ciudad seleccionada.",
      });
    }

    await ctx.db.patch(seller._id, {
      defaultCitySlug: city.slug,
      defaultCurrency: city.currency,
    });
  },
});
