import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Listing } from "./listings";
import { resend, RESEND_NO_REPLY_FROM } from "./resend";
import type { User } from "./users";
import type { Seller } from "./sellers";
import type { Sticker } from "./stickers";

const LISTING_INQUIRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CLIENT_WINDOW_MS = 60 * 60 * 1000;
const CLIENT_WINDOW_MAX_INQUIRIES = 10;
const MAX_MESSAGE_LENGTH = 500;

type InquiryTarget = {
  listing: Listing;
  seller: Seller;
  sellerUser: User;
  sticker: Sticker;
  hasRecentListingInquiry: boolean;
  recentClientInquiryCount: number;
};

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

export const resolveInquiryTarget = internalQuery({
  args: {
    listingId: v.id("listings"),
    anonymousClientId: v.string(),
    nowMs: v.number(),
  },
  handler: async (ctx, args): Promise<InquiryTarget> => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing || listing.status !== "active") {
      throw new Error("Este cromo ya no esta disponible.");
    }

    const [seller, sticker] = await Promise.all([
      ctx.db.get(listing.sellerId),
      ctx.db.get(listing.stickerId),
    ]);

    if (!seller || !sticker) {
      throw new Error("No pudimos preparar este contacto.");
    }

    const sellerUser = await ctx.db.get(seller.userId);

    if (!sellerUser?.email) {
      throw new Error("Este vendedor no tiene un email disponible.");
    }

    const recentListingInquiries = await ctx.db
      .query("purchaseInquiries")
      .withIndex("by_anonymousClientId_and_listingId_and_createdAt", (q) =>
        q
          .eq("anonymousClientId", args.anonymousClientId)
          .eq("listingId", args.listingId)
          .gte("createdAt", args.nowMs - LISTING_INQUIRY_COOLDOWN_MS),
      )
      .take(1);

    const recentClientInquiries = await ctx.db
      .query("purchaseInquiries")
      .withIndex("by_anonymousClientId_and_createdAt", (q) =>
        q
          .eq("anonymousClientId", args.anonymousClientId)
          .gte("createdAt", args.nowMs - CLIENT_WINDOW_MS),
      )
      .take(CLIENT_WINDOW_MAX_INQUIRIES);

    return {
      listing,
      seller,
      sellerUser,
      sticker,
      hasRecentListingInquiry: recentListingInquiries.length > 0,
      recentClientInquiryCount: recentClientInquiries.length,
    };
  },
});

export const recordInquiry = internalMutation({
  args: {
    listingId: v.id("listings"),
    sellerId: v.id("sellers"),
    stickerId: v.id("stickers"),
    anonymousClientId: v.string(),
    message: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"purchaseInquiries">> => {
    return await ctx.db.insert("purchaseInquiries", args);
  },
});

export const sendPurchaseInquiry = action({
  args: {
    listingId: v.id("listings"),
    anonymousClientId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();

    if (!message) {
      throw new Error("Escribe un mensaje antes de enviarlo.");
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Tu mensaje es demasiado largo.");
    }

    if (!args.anonymousClientId.trim()) {
      throw new Error("No pudimos validar este intento. Recarga la pagina.");
    }

    const nowMs = Date.now();
    const target: InquiryTarget = await ctx.runQuery(
      internal.purchaseInquiries.resolveInquiryTarget,
      {
        listingId: args.listingId,
        anonymousClientId: args.anonymousClientId,
        nowMs,
      },
    );

    if (target.hasRecentListingInquiry) {
      throw new Error(
        "Ya enviaste un mensaje para este cromo recientemente. Intenta de nuevo mas tarde.",
      );
    }

    if (target.recentClientInquiryCount >= CLIENT_WINDOW_MAX_INQUIRIES) {
      throw new Error(
        "Llegaste al limite de mensajes por ahora. Intenta de nuevo en un rato.",
      );
    }

    const sellerEmail = target.sellerUser.email;

    if (!sellerEmail) {
      throw new Error("Este vendedor no tiene un email disponible.");
    }

    const result = await resend.emails.send({
      from: RESEND_NO_REPLY_FROM,
      to: sellerEmail,
      subject: buildEmailSubject(target.sticker),
      text: buildEmailText({
        sellerName: target.seller.displayName,
        sticker: target.sticker,
        message,
      }),
      html: buildEmailHtml({
        sellerName: target.seller.displayName,
        sticker: target.sticker,
        message,
      }),
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    await ctx.runMutation(internal.purchaseInquiries.recordInquiry, {
      listingId: target.listing._id,
      sellerId: target.seller._id,
      stickerId: target.sticker._id,
      anonymousClientId: args.anonymousClientId,
      message,
      createdAt: nowMs,
    });

    return { ok: true };
  },
});
