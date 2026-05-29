import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { resend, RESEND_NO_REPLY_FROM } from "./resend";
import type { CurrentUserData, User } from "./users";
import type { Listing } from "./listings";
import type { Seller } from "./sellers";
import type { Sticker } from "./stickers";

const MAX_MESSAGE_LENGTH = 500;
const CONTACT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

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

function buildEmailSubject(sticker: Doc<"stickers">) {
  return `Nuevo interesado en tu cromo ${buildStickerName(sticker)}`;
}

function buildEmailText(args: {
  sellerName: string;
  sticker: Doc<"stickers">;
  message: string;
}) {
  return [
    `Hola ${args.sellerName},`,
    "",
    `Recibiste un nuevo mensaje sobre tu cromo ${buildStickerName(args.sticker)} en Stickerts.`,
    "",
    "Mensaje del comprador:",
    args.message,
    "",
    "Te recomendamos coordinar la transacción en un lugar público.",
  ].join("\n");
}

function buildEmailHtml(args: {
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
      <p>Hola ${args.sellerName},</p>
      <p>
        Recibiste un nuevo mensaje sobre tu cromo
        <strong>${buildStickerName(args.sticker)}</strong> en Stickerts.
      </p>
      <p style="margin-bottom: 8px;"><strong>Mensaje del comprador:</strong></p>
      <div
        style="border-radius: 16px; background: #f3f4f6; padding: 16px; white-space: pre-wrap;"
      >
        ${messageHtml}
      </div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
        Te recomendamos coordinar la transacción en un lugar público.
      </p>
    </div>
  `;
}

async function requireCurrentUser(ctx: ActionCtx) {
  const currentUser: CurrentUserData | null = await ctx.runQuery(
    api.users.getCurrentUser,
    {},
  );

  if (!currentUser) {
    throwContactError(
      "AUTHENTICATION_REQUIRED",
      "Debes iniciar sesion para contactar vendedores.",
    );
  }

  return currentUser;
}

export const resolveSellerContactTarget = internalQuery({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args): Promise<ContactTarget> => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing || listing.status !== "active") {
      throwContactError(
        "CONTACT_LISTING_UNAVAILABLE",
        "Este cromo ya no esta disponible.",
      );
    }

    const [seller, sticker] = await Promise.all([
      ctx.db.get(listing.sellerId),
      ctx.db.get(listing.stickerId),
    ]);

    if (!seller || !sticker) {
      throwContactError(
        "CONTACT_TARGET_UNAVAILABLE",
        "No pudimos preparar este contacto.",
      );
    }

    const sellerUser = await ctx.db.get(seller.userId);

    if (!sellerUser?.email) {
      throwContactError(
        "CONTACT_SELLER_EMAIL_UNAVAILABLE",
        "Este vendedor no tiene un email disponible.",
      );
    }

    return { listing, seller, sellerUser, sticker };
  },
});

export const consumeFreeSellerContactIfNeeded = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throwContactError(
        "CONTACT_USER_NOT_FOUND",
        "No encontramos al usuario actual.",
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
        "Ya usaste tu contacto con vendedores gratis.",
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
        "Ya contactaste a este vendedor por esta publicacion en las ultimas 24 horas.",
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
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    const nowMs = Date.now();

    if (!message) {
      throwContactError(
        "CONTACT_MESSAGE_REQUIRED",
        "Escribe un mensaje antes de enviarlo.",
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throwContactError(
        "CONTACT_MESSAGE_TOO_LONG",
        "Tu mensaje es demasiado largo.",
      );
    }

    const currentUser = await requireCurrentUser(ctx);
    const target: ContactTarget = await ctx.runQuery(
      internal.contacts.resolveSellerContactTarget,
      { listingId: args.listingId },
    );

    if (target.seller.userId === currentUser.user._id) {
      throwContactError(
        "CONTACT_SELF_NOT_ALLOWED",
        "No puedes contactarte con tu propia publicacion.",
      );
    }

    await ctx.runQuery(internal.contacts.assertContactRateLimit, {
      senderUserId: currentUser.user._id,
      listingId: args.listingId,
      nowMs,
    });

    const { consumedFreeContact } = await ctx.runMutation(
      internal.contacts.consumeFreeSellerContactIfNeeded,
      { userId: currentUser.user._id },
    );

    try {
      const result = await resend.emails.send({
        from: RESEND_NO_REPLY_FROM,
        to: target.sellerUser.email,
        subject: buildEmailSubject(target.sticker),
        text: buildEmailText({
          sellerName: target.sellerUser.name,
          sticker: target.sticker,
          message,
        }),
        html: buildEmailHtml({
          sellerName: target.sellerUser.name,
          sticker: target.sticker,
          message,
        }),
      });

      if (result.error) {
        throwContactError(
          "CONTACT_SEND_FAILED",
          "No pudimos enviar tu mensaje. Intenta de nuevo.",
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
