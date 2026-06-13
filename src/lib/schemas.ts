import { z } from "zod";
import type { Id } from "$convex/_generated/dataModel";
import * as m from "$lib/paraglide/messages";

const PRICE_DECIMAL_PRECISION_EPSILON = 1e-6;

export const listingIntents = ["sale", "trade", "sale_or_trade"] as const;
export type ListingIntent = (typeof listingIntents)[number];

export const listingSearchParamsSchema = z.object({
  q: z.string().default(""),
});

function createRequiredFileSchema() {
  return z.custom<File>(
    (value) => value instanceof File,
    m.error_upload_image_required(),
  );
}

function createRequiredStickerIdSchema() {
  return z.custom<Id<"stickers">>(
    (value) => typeof value === "string" && value.length > 0,
    m.error_upload_sticker_required(),
  );
}

function createRequiredCitySlugSchema() {
  return z.custom<string>(
    (value) => typeof value === "string" && value.length > 0,
    m.error_upload_city_required(),
  );
}

function createRequiredCurrencySchema() {
  return z.custom<string>(
    (value) => typeof value === "string" && value.length > 0,
    m.error_upload_currency_required(),
  );
}

const listingIntentSchema = z.enum(listingIntents).default("sale");

function createPriceSchema() {
  return z
    .custom<number>(
      (value) => typeof value === "number" && Number.isFinite(value),
      m.error_upload_price_required(),
    )
    .refine((value) => value > 0, m.error_upload_price_required());
}

function createOptionalPriceSchema() {
  return z.union([createPriceSchema(), z.null(), z.undefined()]);
}

function createQuantitySchema() {
  return z
    .custom<number>(
      (value) => typeof value === "number" && Number.isFinite(value),
      m.error_upload_quantity_required(),
    )
    .refine(
      (value) => Number.isInteger(value) && value > 0,
      m.error_upload_quantity_required(),
    );
}

export function createNewListingFormSchema() {
  const requiredStickerIdSchema = createRequiredStickerIdSchema();
  const requiredCurrencySchema = createRequiredCurrencySchema();

  return z
    .object({
      imageFile: createRequiredFileSchema(),
      intent: listingIntentSchema,
      selectedStickerId: requiredStickerIdSchema,
      selectedCitySlug: createRequiredCitySlugSchema(),
      selectedCurrency: z.string().optional(),
      price: createOptionalPriceSchema(),
      quantity: createQuantitySchema(),
      tradeDescription: z.string().optional(),
      wantedStickerIds: z.array(requiredStickerIdSchema).optional(),
    })
    .superRefine((data, ctx) => {
      const isForSale =
        data.intent === "sale" || data.intent === "sale_or_trade";

      if (isForSale) {
        if (data.price === null || data.price === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["price"],
            message: m.error_upload_price_required(),
          });
        }

        if (!requiredCurrencySchema.safeParse(data.selectedCurrency).success) {
          ctx.addIssue({
            code: "custom",
            path: ["selectedCurrency"],
            message: m.error_upload_currency_required(),
          });
        }
      }

      if (data.price === null || data.price === undefined) {
        return;
      }

      const rawPriceCents = data.price * 100;
      const roundedPriceCents = Math.round(rawPriceCents);

      if (
        Math.abs(rawPriceCents - roundedPriceCents) >
        PRICE_DECIMAL_PRECISION_EPSILON
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: m.error_upload_price_decimals(),
        });
      }
    })
    .transform((data) => ({
      imageFile: data.imageFile,
      intent: data.intent,
      stickerId: data.selectedStickerId,
      citySlug: data.selectedCitySlug,
      currency:
        data.selectedCurrency === undefined || data.selectedCurrency === ""
          ? undefined
          : data.selectedCurrency,
      quantityAvailable: data.quantity,
      priceCents:
        data.price === null || data.price === undefined
          ? undefined
          : Math.round(data.price * 100),
      tradeDescription:
        data.tradeDescription === undefined || data.tradeDescription === ""
          ? undefined
          : data.tradeDescription,
      wantedStickerIds:
        data.wantedStickerIds === undefined || data.wantedStickerIds.length === 0
          ? undefined
          : data.wantedStickerIds,
    }));
}

export function createRecordSaleFormSchema(
  maxQuantity: number,
  shouldRequireUnitPrice: boolean,
) {
  const unitPriceSchema = shouldRequireUnitPrice
    ? createPriceSchema()
    : createOptionalPriceSchema();

  return z
    .object({
      quantity: createQuantitySchema(),
      unitPrice: unitPriceSchema,
    })
    .superRefine((data, ctx) => {
      if (data.quantity > maxQuantity) {
        ctx.addIssue({
          code: "custom",
          path: ["quantity"],
          message: m.record_sale_quantity_exceeds_available(),
        });
      }

      if (data.unitPrice === null || data.unitPrice === undefined) {
        return;
      }

      const rawPriceCents = data.unitPrice * 100;
      const roundedPriceCents = Math.round(rawPriceCents);

      if (
        Math.abs(rawPriceCents - roundedPriceCents) >
        PRICE_DECIMAL_PRECISION_EPSILON
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["unitPrice"],
          message: m.error_upload_price_decimals(),
        });
      }
    })
    .transform((data) => ({
      quantity: data.quantity,
      unitPriceCents:
        data.unitPrice === null || data.unitPrice === undefined
          ? undefined
          : Math.round(data.unitPrice * 100),
    }));
}

export const createSignedUploadResponseSchema = z.object({
  signedUrl: z.url(),
  imageKey: z.string().min(1),
});

export type NewListingFormData = z.output<ReturnType<typeof createNewListingFormSchema>>;
export type CreateSignedUploadResponse = z.infer<
  typeof createSignedUploadResponseSchema
>;
export type RecordSaleFormData = z.output<
  ReturnType<typeof createRecordSaleFormSchema>
>;
