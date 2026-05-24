import stickersJson from "../lib/assets/stickers.json";

import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";

type StickerType =
  | "player"
  | "emblem"
  | "squad"
  | "intro"
  | "history"
  | "unknown";

type StickerSeedEntry = {
  code: string;
  label: string;
  section: string;
  type: StickerType;
  sticker_number: number;
  album_page: number;
};

const stickerSeed = stickersJson as StickerSeedEntry[];

const validStickerTypes = new Set<StickerType>([
  "player",
  "emblem",
  "squad",
  "intro",
  "history",
  "unknown",
]);

export const seedStickers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const existingStickers = await ctx.db
      .query("stickers")
      .withIndex("by_code")
      .take(2000);
    const existingByCode = new Map(
      existingStickers.map((sticker) => [sticker.code, sticker]),
    );
    const seedCodes = new Set<string>();

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    for (const sticker of stickerSeed) {
      if (!validStickerTypes.has(sticker.type)) {
        throw new Error(
          `Unsupported sticker type for ${sticker.code}: ${sticker.type}`,
        );
      }

      seedCodes.add(sticker.code);

      const stickerFields = {
        code: sticker.code,
        label: sticker.label,
        section: sticker.section,
        type: sticker.type,
        stickerNumber: sticker.sticker_number,
        albumPage: sticker.album_page,
        isActive: true,
        updatedAt: now,
      };

      const existingSticker = existingByCode.get(sticker.code);

      if (existingSticker) {
        await ctx.db.patch(existingSticker._id, stickerFields);
        updated += 1;
      } else {
        await ctx.db.insert("stickers", stickerFields);
        created += 1;
      }
    }

    for (const existingSticker of existingStickers) {
      if (!seedCodes.has(existingSticker.code) && existingSticker.isActive) {
        await ctx.db.patch(existingSticker._id, {
          isActive: false,
          updatedAt: now,
        });
        deactivated += 1;
      }
    }

    return {
      created,
      updated,
      deactivated,
      totalInSeed: stickerSeed.length,
    };
  },
});

export const listActiveStickers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stickers")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(2000);
  },
});

export const getStickerByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stickers")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
