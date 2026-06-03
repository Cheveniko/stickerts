import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import * as m from "../lib/paraglide/messages.js";
import { messageOptions, type AppLocale } from "./i18n";
import { resend, RESEND_NO_REPLY_FROM } from "./resend";
import type { CurrentUserData, User } from "./users";
import type { Listing } from "./listings";
import type { Seller } from "./sellers";
import type { Sticker } from "./stickers";

const MAX_MESSAGE_LENGTH = 500;
const CONTACT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const localeValidator = v.optional(v.union(v.literal("es"), v.literal("en")));

type ContactTarget = {
  listing: Listing;
  seller: Seller;
  sellerUser: User;
  sticker: Sticker;
};

function throwContactError(code: string, message: string): never {
  throw new ConvexError({ code, message });
}

function buildStickerName(sticker: Doc<"stickers">) {
  return sticker.code ? `${sticker.label} (${sticker.code})` : sticker.label;
}

function buildEmailSubject(sticker: Doc<"stickers">, locale: AppLocale) {
  return m.email_contact_subject(
    { stickerName: buildStickerName(sticker) },
    messageOptions(locale),
  );
}

function buildEmailText(args: {
  locale: AppLocale;
  sellerName: string;
  sticker: Doc<"stickers">;
  message: string;
}) {
  return [
    m.email_contact_greeting(
      { sellerName: args.sellerName },
      messageOptions(args.locale),
    ),
    "",
    m.email_contact_intro(
      { stickerName: buildStickerName(args.sticker) },
      messageOptions(args.locale),
    ),
    "",
    m.email_contact_message_label({}, messageOptions(args.locale)),
    args.message,
    "",
    m.email_contact_safety_notice({}, messageOptions(args.locale)),
  ].join("\n");
}

function buildEmailHtml(args: {
  locale: AppLocale;
  sellerName: string;
  sticker: Doc<"stickers">;
  message: string;
}) {
  const messageHtml = args.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>${m.email_contact_greeting({ sellerName: args.sellerName }, messageOptions(args.locale))}</p>
      <p>
        ${m.email_contact_intro({ stickerName: buildStickerName(args.sticker) }, messageOptions(args.locale))}
      </p>
      <p style="margin-bottom: 8px;"><strong>${m.email_contact_message_label({}, messageOptions(args.locale))}</strong></p>
      <div
        style="border-radius: 16px; background: #f3f4f6; padding: 16px; white-space: pre-wrap;"
      >
        ${messageHtml}
      </div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
        ${m.email_contact_safety_notice({}, messageOptions(args.locale))}
      </p>
    </div>
  `;
}

async function requireCurrentUser(ctx: ActionCtx, locale: AppLocale) {
  const currentUser: CurrentUserData | null = await ctx.runQuery(
    api.users.getCurrentUser,
    {},
  );

  if (!currentUser) {
    throwContactError(
      "AUTHENTICATION_REQUIRED",
      m.error_authentication_required({}, messageOptions(locale)),
    );
  }

  return currentUser;
}

export const resolveSellerContactTarget = internalQuery({
  args: {
    listingId: v.id("listings"),
    locale: localeValidator,
  },
  handler: async (ctx, args): Promise<ContactTarget> => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing || listing.status !== "active") {
      throwContactError(
        "CONTACT_LISTING_UNAVAILABLE",
        m.error_contact_listing_unavailable({}, messageOptions(args.locale)),
      );
    }

    const [seller, sticker] = await Promise.all([
      ctx.db.get(listing.sellerId),
      ctx.db.get(listing.stickerId),
    ]);

    if (!seller || !sticker) {
      throwContactError(
        "CONTACT_TARGET_UNAVAILABLE",
        m.error_contact_target_unavailable({}, messageOptions(args.locale)),
      );
    }

    const sellerUser = await ctx.db.get(seller.userId);

    if (!sellerUser?.email) {
      throwContactError(
        "CONTACT_SELLER_EMAIL_UNAVAILABLE",
        m.error_contact_seller_email_unavailable(
          {},
          messageOptions(args.locale),
        ),
      );
    }

    return { listing, seller, sellerUser, sticker };
  },
});

export const consumeFreeSellerContactIfNeeded = internalMutation({
  args: {
    userId: v.id("users"),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throwContactError(
        "CONTACT_USER_NOT_FOUND",
        m.error_contact_user_not_found({}, messageOptions(args.locale)),
      );
    }

    const seller = await ctx.db
      .query("sellers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (seller) {
      return { consumedFreeContact: false };
    }

    if (user.freeSellerContactsRemaining <= 0) {
      throwContactError(
        "CONTACT_FREE_LIMIT_REACHED",
        m.error_contact_free_limit_reached({}, messageOptions(args.locale)),
      );
    }

    await ctx.db.patch(args.userId, {
      freeSellerContactsRemaining: user.freeSellerContactsRemaining - 1,
    });

    return { consumedFreeContact: true };
  },
});

export const assertContactRateLimit = internalQuery({
  args: {
    senderUserId: v.id("users"),
    listingId: v.id("listings"),
    nowMs: v.number(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const recentContacts = await ctx.db
      .query("contacts")
      .withIndex("by_senderUserId_and_listingId_and_createdAt", (q) =>
        q
          .eq("senderUserId", args.senderUserId)
          .eq("listingId", args.listingId)
          .gte("createdAt", args.nowMs - CONTACT_RATE_LIMIT_WINDOW_MS),
      )
      .take(1);

    if (recentContacts.length > 0) {
      throwContactError(
        "CONTACT_RATE_LIMITED",
        m.error_contact_rate_limited({}, messageOptions(args.locale)),
      );
    }
  },
});

export const recordContact = internalMutation({
  args: {
    senderUserId: v.id("users"),
    listingId: v.id("listings"),
    sellerId: v.id("sellers"),
    stickerId: v.id("stickers"),
    message: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", args);
  },
});

export const refundFreeSellerContactIfNeeded = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return;
    }

    await ctx.db.patch(args.userId, {
      freeSellerContactsRemaining: user.freeSellerContactsRemaining + 1,
    });
  },
});

export const sendSellerContact = action({
  args: {
    listingId: v.id("listings"),
    message: v.string(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const locale = args.locale ?? "es";
    const message = args.message.trim();
    const nowMs = Date.now();

    if (!message) {
      throwContactError(
        "CONTACT_MESSAGE_REQUIRED",
        m.error_contact_message_required({}, messageOptions(locale)),
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throwContactError(
        "CONTACT_MESSAGE_TOO_LONG",
        m.error_contact_message_too_long({}, messageOptions(locale)),
      );
    }

    const currentUser = await requireCurrentUser(ctx, locale);
    const target: ContactTarget = await ctx.runQuery(
      internal.contacts.resolveSellerContactTarget,
      { listingId: args.listingId, locale },
    );

    if (target.seller.userId === currentUser.user._id) {
      throwContactError(
        "CONTACT_SELF_NOT_ALLOWED",
        m.error_contact_self_not_allowed({}, messageOptions(locale)),
      );
    }

    await ctx.runQuery(internal.contacts.assertContactRateLimit, {
      senderUserId: currentUser.user._id,
      listingId: args.listingId,
      nowMs,
      locale,
    });

    const { consumedFreeContact } = await ctx.runMutation(
      internal.contacts.consumeFreeSellerContactIfNeeded,
      { userId: currentUser.user._id, locale },
    );

    try {
      const result = await resend.emails.send({
        from: RESEND_NO_REPLY_FROM,
        to: target.sellerUser.email,
        subject: buildEmailSubject(target.sticker, locale),
        text: buildEmailText({
          locale,
          sellerName: target.sellerUser.name,
          sticker: target.sticker,
          message,
        }),
        html: buildEmailHtml({
          locale,
          sellerName: target.sellerUser.name,
          sticker: target.sticker,
          message,
        }),
      });

      if (result.error) {
        throwContactError(
          "CONTACT_SEND_FAILED",
          m.error_contact_send_failed({}, messageOptions(locale)),
        );
      }

      await ctx.runMutation(internal.contacts.recordContact, {
        senderUserId: currentUser.user._id,
        listingId: target.listing._id,
        sellerId: target.seller._id,
        stickerId: target.sticker._id,
        message,
        createdAt: nowMs,
      });
    } catch (error) {
      if (consumedFreeContact) {
        await ctx.runMutation(
          internal.contacts.refundFreeSellerContactIfNeeded,
          {
            userId: currentUser.user._id,
          },
        );
      }

      throw error;
    }

    return { ok: true };
  },
});
