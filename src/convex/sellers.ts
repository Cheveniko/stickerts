import type { Doc } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { t } from "./messages";
import { getCurrentAuthUserId, requireAuthUserId } from "./authHelpers";
import { getCityBySlug, type City } from "./cities";
import { type AppLocale } from "./i18n";
import type { User } from "./users";

export type Seller = Doc<"sellers">;
export type CurrentSeller = Seller & { city: City | null };

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
const DEFAULT_CURRENCY_REGEX = /^[A-Z]{3}$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;

type SellerDbCtx = Pick<QueryCtx, "db">;
type SellerWriteCtx = Pick<MutationCtx, "db">;

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

export async function requireCurrentSeller(
  ctx: SellerDbCtx,
  userId: Seller["userId"],
  locale?: AppLocale,
) {
  const seller = await getSellerByUserId(ctx, userId);

  if (!seller) {
    throw new ConvexError({
      code: "SELLER_NOT_FOUND",
      message: t(locale, "error_seller_not_found"),
    });
  }

  return seller;
}

function normalizeUsername(username: string, locale?: AppLocale) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    throw new ConvexError({
      code: "INVALID_USERNAME",
      message: t(locale, "error_invalid_username"),
    });
  }

  return normalizedUsername;
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function sanitizeUsernameBase(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function clampUsernameBase(value: string, maxLength: number) {
  return value.slice(0, maxLength).replace(/_+$/g, "");
}

function buildUsernameCandidate(base: string, suffix: number, locale?: AppLocale) {
  const suffixText = suffix === 0 ? "" : `_${suffix}`;
  const trimmedBase = clampUsernameBase(
    base,
    MAX_USERNAME_LENGTH - suffixText.length,
  );

  if (trimmedBase.length < MIN_USERNAME_LENGTH) {
    return null;
  }

  return normalizeUsername(`${trimmedBase}${suffixText}`, locale);
}

function getInitialUsernameBases(user: User) {
  const emailPrefix = user.email.split("@")[0] ?? "";

  return [...new Set([user.name, emailPrefix, "collector"])]
    .map(sanitizeUsernameBase)
    .filter((value) => value.length >= MIN_USERNAME_LENGTH);
}

export async function generateUniqueSellerUsername(
  ctx: SellerDbCtx,
  user: User,
  locale?: AppLocale,
) {
  const bases = getInitialUsernameBases(user);

  for (const base of bases) {
    for (let suffix = 0; suffix < 1000; suffix += 1) {
      const candidate = buildUsernameCandidate(base, suffix, locale);

      if (!candidate) {
        continue;
      }

      const existingSeller = await ctx.db
        .query("sellers")
        .withIndex("by_username", (q) => q.eq("username", candidate))
        .unique();

      if (!existingSeller) {
        return candidate;
      }
    }
  }

  throw new ConvexError({
    code: "USERNAME_GENERATION_FAILED",
    message: t(locale, "error_username_generation_failed"),
  });
}

function normalizeCurrency(currency: string, locale?: AppLocale) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (!DEFAULT_CURRENCY_REGEX.test(normalizedCurrency)) {
    throw new ConvexError({
      code: "INVALID_DEFAULT_CURRENCY",
      message: t(locale, "error_invalid_default_currency"),
    });
  }

  return normalizedCurrency;
}

export async function activateSellerForCollectorPass(
  ctx: SellerWriteCtx,
  userId: Seller["userId"],
  activatedAt: number,
  locale?: AppLocale,
) {
  const existingSeller = await getSellerByUserId(ctx, userId);

  if (existingSeller) {
    return existingSeller._id;
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error(t(locale, "error_seller_activation_user_not_found"));
  }

  const username = await generateUniqueSellerUsername(ctx, user, locale);

  return await ctx.db.insert("sellers", {
    userId,
    status: "active",
    activatedAt,
    username,
    ...(user.image ? { avatarUrl: user.image } : {}),
    totalSalesCount: 0,
    totalStickersSold: 0,
    totalRevenueCents: 0,
    activeListingsCount: 0,
  });
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
        message: t(undefined, "error_username_taken"),
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
          message: t(undefined, "error_city_not_found"),
        });
      }

    await ctx.db.patch(seller._id, {
      defaultCitySlug: city.slug,
      defaultCurrency: city.currency,
    });
  },
});
