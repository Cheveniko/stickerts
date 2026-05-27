import { z } from "zod";
import type { Id } from "$convex/_generated/dataModel";

const PRICE_DECIMAL_PRECISION_EPSILON = 1e-6;

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

const priceSchema = z
  .custom<number>(
    (value) => typeof value === "number" && Number.isFinite(value),
    "Ingresa un precio mayor a 0.",
  )
  .refine((value) => value > 0, "Ingresa un precio mayor a 0.");

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
    selectedStickerId: requiredStickerIdSchema,
    selectedCitySlug: requiredCitySlugSchema,
    selectedCurrency: requiredCurrencySchema,
    price: priceSchema,
    quantity: quantitySchema,
  })
  .superRefine((data, ctx) => {
    const rawPriceCents = data.price * 100;
    const roundedPriceCents = Math.round(rawPriceCents);

    if (
      Math.abs(rawPriceCents - roundedPriceCents) >
      PRICE_DECIMAL_PRECISION_EPSILON
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "El precio puede tener máximo 2 decimales.",
      });
    }
  })
  .transform((data) => ({
    imageFile: data.imageFile,
    stickerId: data.selectedStickerId,
    citySlug: data.selectedCitySlug,
    currency: data.selectedCurrency,
    quantityAvailable: data.quantity,
    priceCents: Math.round(data.price * 100),
  }));

export const createSignedUploadResponseSchema = z.object({
  signedUrl: z.string().url(),
  imageKey: z.string().min(1),
});

export type NewListingFormData = z.output<typeof newListingFormSchema>;
export type CreateSignedUploadResponse = z.infer<
  typeof createSignedUploadResponseSchema
>;
