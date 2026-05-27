import { error, json, type RequestHandler } from "@sveltejs/kit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { AWS_REGION, AWS_S3_BUCKET } from "$env/static/private";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";
import { getValidAuthToken } from "$lib/auth/server";

const maxUploadSizeBytes = 5 * 1024 * 1024;

const extensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

const s3 = new S3Client({ region: AWS_REGION });

const createSignedUploadSchema = z.object({
  contentType: z.custom<keyof typeof extensionByContentType>(
    (value) => typeof value === "string" && value in extensionByContentType,
    { message: "Solo aceptamos imagenes JPG o PNG." },
  ),
  size: z
    .number()
    .refine(
      (value) =>
        Number.isFinite(value) && value > 0 && value <= maxUploadSizeBytes,
      { message: "La imagen supera el tamano maximo permitido." },
    ),
});

function createConvexHttpClient(token: string) {
  const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
  client.setAuth(token);
  return client;
}

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = await getValidAuthToken(cookies);

  if (!token) {
    error(401, "No autenticado.");
  }

  const payload = createSignedUploadSchema.safeParse(await request.json());

  if (!payload.success) {
    error(400, payload.error.issues[0]?.message ?? "Solicitud invalida.");
  }

  const { contentType } = payload.data;

  const convex = createConvexHttpClient(token);
  const seller = await convex.query(api.sellers.getCurrentSeller, {});

  if (!seller) {
    error(403, "Solo los sellers pueden subir imagenes.");
  }

  if (seller.status !== "active") {
    error(403, "Tu cuenta seller no puede subir imagenes en este momento.");
  }

  const extension = extensionByContentType[contentType];
  const imageKey = `listings/${seller._id}/${crypto.randomUUID()}.${extension}`;

  const signedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: imageKey,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 60 },
  );

  return json({
    signedUrl,
    imageKey,
    contentType,
    maxUploadSizeBytes,
  });
};
