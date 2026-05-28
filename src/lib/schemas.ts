import { z } from "zod";
import type { Id } from "$convex/_generated/dataModel";

const PRICE_DECIMAL_PRECISION_EPSILON = 1e-6;

export const listingIntents = ["trade", "sale", "sale_or_trade"] as const;
export type ListingIntent = (typeof listingIntents)[number];

const requiredFileSchema = z.custom<File>(
  (value) => value instanceof File,
  "Selecciona una imagen para publicar tu cromo.",
);

const requiredStickerIdSchema = z.custom<Id<"stickers">>(
  (value) => typeof value === "string" && value.length > 0,
  "Selecciona el cromo que quieres publicar.",
);

const requiredCitySlugSchema = z.custom<string>(
  (value) => typeof value === "string" && value.length > 0,
  "Selecciona una ciudad.",
);

const requiredCurrencySchema = z.custom<string>(
  (value) => typeof value === "string" && value.length > 0,
  "Selecciona una moneda.",
);

const listingIntentSchema = z.enum(listingIntents).default("trade");

const priceSchema = z
  .custom<number>(
    (value) => typeof value === "number" && Number.isFinite(value),
    "Ingresa un precio mayor a 0.",
  )
  .refine((value) => value > 0, "Ingresa un precio mayor a 0.");

const optionalPriceSchema = z.union([priceSchema, z.null(), z.undefined()]);

const quantitySchema = z
  .custom<number>(
    (value) => typeof value === "number" && Number.isFinite(value),
    "Ingresa una cantidad entera mayor a 0.",
  )
  .refine(
    (value) => Number.isInteger(value) && value > 0,
    "Ingresa una cantidad entera mayor a 0.",
  );

export const newListingFormSchema = z
  .object({
    imageFile: requiredFileSchema,
    intent: listingIntentSchema,
    selectedStickerId: requiredStickerIdSchema,
    selectedCitySlug: requiredCitySlugSchema,
    selectedCurrency: z.string().optional(),
    price: optionalPriceSchema,
    quantity: quantitySchema,
    tradeDescription: z.string().optional(),
    wantedStickerIds: z.array(requiredStickerIdSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const isForSale = data.intent === "sale" || data.intent === "sale_or_trade";

    if (isForSale) {
      if (data.price === null || data.price === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Ingresa un precio mayor a 0.",
        });
      }

      if (!requiredCurrencySchema.safeParse(data.selectedCurrency).success) {
        ctx.addIssue({
          code: "custom",
          path: ["selectedCurrency"],
          message: "Selecciona una moneda.",
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
        message: "El precio puede tener máximo 2 decimales.",
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

export const createSignedUploadResponseSchema = z.object({
  signedUrl: z.url(),
  imageKey: z.string().min(1),
});

export type NewListingFormData = z.output<typeof newListingFormSchema>;
export type CreateSignedUploadResponse = z.infer<
  typeof createSignedUploadResponseSchema
>;
