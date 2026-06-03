import { error, json, type RequestHandler } from "@sveltejs/kit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { AWS_REGION, AWS_S3_BUCKET } from "$env/static/private";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";
import { getValidAuthToken } from "$lib/auth/server";
import * as m from "$lib/paraglide/messages";

const maxUploadSizeBytes = 5 * 1024 * 1024;

const extensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

const s3 = new S3Client({ region: AWS_REGION });

function createSignedUploadSchema() {
  return z.object({
    contentType: z.custom<keyof typeof extensionByContentType>(
      (value) => typeof value === "string" && value in extensionByContentType,
      { message: m.error_upload_invalid_type() },
    ),
    size: z
      .number()
      .refine(
        (value) =>
          Number.isFinite(value) && value > 0 && value <= maxUploadSizeBytes,
        { message: m.error_upload_size_limit() },
      ),
  });
}

function createConvexHttpClient(token: string) {
  const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
  client.setAuth(token);
  return client;
}

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = await getValidAuthToken(cookies);

  if (!token) {
    error(401, m.error_upload_unauthenticated());
  }

  const payload = createSignedUploadSchema().safeParse(await request.json());

  if (!payload.success) {
    error(400, payload.error.issues[0]?.message ?? m.error_upload_invalid_request());
  }

  const { contentType } = payload.data;

  const convex = createConvexHttpClient(token);
  const seller = await convex.query(api.sellers.getCurrentSeller, {});

  if (!seller) {
    error(403, m.error_upload_seller_only());
  }

  if (seller.status !== "active") {
    error(403, m.error_upload_seller_inactive());
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
