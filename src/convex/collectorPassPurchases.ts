import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  type ActionCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { t } from "./messages";
import { type AppLocale } from "./i18n";
import { activateSellerForCollectorPass } from "./sellers";
import type { CurrentUserData } from "./users";

const COLLECTOR_PASS_AMOUNT_CENTS = 199;
const COLLECTOR_PASS_CURRENCY = "USD";
const localeValidator = v.optional(v.union(v.literal("es"), v.literal("en")));

type CollectorPassPurchase = Doc<"collectorPassPurchases">;
type CollectorPassPurchaseReadCtx = Pick<QueryCtx, "db">;

class PaypalApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = "PaypalApiError";
    this.status = status;
    this.data = data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatAmountCents(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

function parseAmountCents(value: string, locale: AppLocale) {
  const normalizedValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error(t(locale, "error_paypal_invalid_amount"));
  }

  return Math.round(Number(normalizedValue) * 100);
}

function getPaypalBaseUrl() {
  const configuredBaseUrl = process.env.PAYPAL_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getPaypalCredentials(locale: AppLocale) {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(t(locale, "error_paypal_not_configured"));
  }

  return { clientId, clientSecret };
}

function buildPaypalAuthorization(clientId: string, clientSecret: string) {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

function extractPaypalErrorMessage(data: unknown) {
  if (!isRecord(data)) {
    return null;
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data.details)) {
    for (const detail of data.details) {
      if (!isRecord(detail)) {
        continue;
      }

      if (typeof detail.description === "string" && detail.description.trim()) {
        return detail.description;
      }
    }
  }

  return null;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function paypalRequest(
  path: string,
  init: RequestInit,
  locale: AppLocale,
) {
  const response = await fetch(`${getPaypalBaseUrl()}${path}`, init);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new PaypalApiError(
      response.status,
      data,
      extractPaypalErrorMessage(data) ??
        t(locale, "error_paypal_request_rejected"),
    );
  }

  return data;
}

function isOrderAlreadyCapturedError(error: unknown) {
  if (!(error instanceof PaypalApiError) || !isRecord(error.data)) {
    return false;
  }

  if (!Array.isArray(error.data.details)) {
    return false;
  }

  return error.data.details.some(
    (detail) => isRecord(detail) && detail.issue === "ORDER_ALREADY_CAPTURED",
  );
}

async function getPaypalAccessToken(locale: AppLocale) {
  const { clientId, clientSecret } = getPaypalCredentials(locale);
  const data = await paypalRequest(
    "/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: buildPaypalAuthorization(clientId, clientSecret),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    },
    locale,
  );

  if (
    !isRecord(data) ||
    typeof data.access_token !== "string" ||
    !data.access_token
  ) {
    throw new Error(t(locale, "error_paypal_invalid_token"));
  }

  return data.access_token;
}

async function createPaypalOrder(
  accessToken: string,
  userId: string,
  locale: AppLocale,
) {
  const data = await paypalRequest(
    "/v2/checkout/orders",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
        purchase_units: [
          {
            reference_id: "collector_pass_2026",
            description: t(locale, "collector_pass_order_description"),
            custom_id: userId,
            amount: {
              currency_code: COLLECTOR_PASS_CURRENCY,
              value: formatAmountCents(COLLECTOR_PASS_AMOUNT_CENTS),
            },
          },
        ],
      }),
    },
    locale,
  );

  if (!isRecord(data) || typeof data.id !== "string" || !data.id.trim()) {
    throw new Error(t(locale, "error_paypal_invalid_order_id"));
  }

  return data.id;
}

async function capturePaypalOrder(
  accessToken: string,
  orderId: string,
  locale: AppLocale,
) {
  return await paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    },
    locale,
  );
}

async function getPaypalOrder(
  accessToken: string,
  orderId: string,
  locale: AppLocale,
) {
  return await paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    locale,
  );
}

function validateCapturedOrder(
  data: unknown,
  expectedOrderId: string,
  locale: AppLocale,
) {
  if (!isRecord(data) || data.id !== expectedOrderId) {
    throw new Error(t(locale, "error_paypal_validate_order_failed"));
  }

  if (data.status !== "COMPLETED") {
    throw new Error(t(locale, "error_paypal_order_not_completed"));
  }

  if (!Array.isArray(data.purchase_units) || data.purchase_units.length === 0) {
    throw new Error(t(locale, "error_paypal_invalid_purchase_units"));
  }

  const purchaseUnit = data.purchase_units[0];

  if (!isRecord(purchaseUnit)) {
    throw new Error(t(locale, "error_paypal_invalid_purchase_unit"));
  }

  if (!isRecord(purchaseUnit.amount)) {
    throw new Error(t(locale, "error_paypal_missing_order_amount"));
  }

  const orderAmountCents = parseAmountCents(
    String(purchaseUnit.amount.value ?? ""),
    locale,
  );
  const orderCurrency = String(purchaseUnit.amount.currency_code ?? "");

  if (
    orderAmountCents !== COLLECTOR_PASS_AMOUNT_CENTS ||
    orderCurrency !== COLLECTOR_PASS_CURRENCY
  ) {
    throw new Error(t(locale, "error_paypal_order_amount_mismatch"));
  }

  if (
    !isRecord(purchaseUnit.payments) ||
    !Array.isArray(purchaseUnit.payments.captures)
  ) {
    throw new Error(t(locale, "error_paypal_missing_capture"));
  }

  const capture = purchaseUnit.payments.captures[0];

  if (
    !isRecord(capture) ||
    typeof capture.id !== "string" ||
    !capture.id.trim()
  ) {
    throw new Error(t(locale, "error_paypal_invalid_capture_id"));
  }

  if (capture.status !== "COMPLETED") {
    throw new Error(t(locale, "error_paypal_capture_not_completed"));
  }

  if (!isRecord(capture.amount)) {
    throw new Error(t(locale, "error_paypal_missing_capture_amount"));
  }

  const captureAmountCents = parseAmountCents(
    String(capture.amount.value ?? ""),
    locale,
  );
  const captureCurrency = String(capture.amount.currency_code ?? "");

  if (
    captureAmountCents !== COLLECTOR_PASS_AMOUNT_CENTS ||
    captureCurrency !== COLLECTOR_PASS_CURRENCY
  ) {
    throw new Error(t(locale, "error_paypal_capture_amount_mismatch"));
  }

  return {
    paypalCaptureId: capture.id,
    amountCents: captureAmountCents,
    currency: captureCurrency,
  };
}

async function requireCurrentUser(ctx: ActionCtx, locale: AppLocale) {
  const currentUser: CurrentUserData | null = await ctx.runQuery(
    api.users.getCurrentUser,
    {},
  );

  if (!currentUser) {
    throw new Error(t(locale, "error_collector_pass_auth_required"));
  }

  return currentUser;
}

async function getPurchaseByUserId(
  ctx: CollectorPassPurchaseReadCtx,
  userId: CollectorPassPurchase["userId"],
) {
  return await ctx.db
    .query("collectorPassPurchases")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

async function getPurchaseByPaypalCaptureId(
  ctx: CollectorPassPurchaseReadCtx,
  paypalCaptureId: string,
) {
  return await ctx.db
    .query("collectorPassPurchases")
    .withIndex("by_paypalCaptureId", (q) =>
      q.eq("paypalCaptureId", paypalCaptureId),
    )
    .unique();
}

export const getPurchaseByUserIdInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await getPurchaseByUserId(ctx, args.userId);
  },
});

export const getPurchaseByPaypalOrderIdInternal = internalQuery({
  args: {
    paypalOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collectorPassPurchases")
      .withIndex("by_paypalOrderId", (q) =>
        q.eq("paypalOrderId", args.paypalOrderId),
      )
      .unique();
  },
});

export const getPurchaseByPaypalCaptureIdInternal = internalQuery({
  args: {
    paypalCaptureId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getPurchaseByPaypalCaptureId(ctx, args.paypalCaptureId);
  },
});

export const upsertPendingPurchaseInternal = internalMutation({
  args: {
    userId: v.id("users"),
    paypalOrderId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    createdAt: v.number(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const existingPurchase = await getPurchaseByUserId(ctx, args.userId);

    if (existingPurchase) {
      if (existingPurchase.completedAt) {
        throw new Error(
          t(args.locale, "error_collector_pass_already_purchased"),
        );
      }

      await ctx.db.patch(existingPurchase._id, {
        paypalOrderId: args.paypalOrderId,
        amountCents: args.amountCents,
        currency: args.currency,
        createdAt: args.createdAt,
      });

      return existingPurchase._id;
    }

    return await ctx.db.insert("collectorPassPurchases", {
      userId: args.userId,
      paypalOrderId: args.paypalOrderId,
      amountCents: args.amountCents,
      currency: args.currency,
      createdAt: args.createdAt,
    });
  },
});

export const finalizePurchaseInternal = internalMutation({
  args: {
    userId: v.id("users"),
    paypalOrderId: v.string(),
    paypalCaptureId: v.string(),
    completedAt: v.number(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const purchase = await getPurchaseByUserId(ctx, args.userId);

    if (!purchase) {
      throw new Error(
        t(args.locale, "error_collector_pass_pending_purchase_user_not_found"),
      );
    }

    if (purchase.paypalOrderId !== args.paypalOrderId) {
      throw new Error(t(args.locale, "error_collector_pass_order_mismatch"));
    }

    const duplicateCapture = await getPurchaseByPaypalCaptureId(
      ctx,
      args.paypalCaptureId,
    );

    if (duplicateCapture && duplicateCapture._id !== purchase._id) {
      throw new Error(t(args.locale, "error_collector_pass_capture_processed"));
    }

    if (purchase.completedAt) {
      if (purchase.paypalCaptureId !== args.paypalCaptureId) {
        throw new Error(
          t(args.locale, "error_collector_pass_completed_with_other_capture"),
        );
      }

      const sellerId = await activateSellerForCollectorPass(
        ctx,
        args.userId,
        purchase.completedAt,
        args.locale,
      );

      return { sellerId, purchaseId: purchase._id };
    }

    const sellerId = await activateSellerForCollectorPass(
      ctx,
      args.userId,
      args.completedAt,
      args.locale,
    );

    await ctx.db.patch(purchase._id, {
      paypalCaptureId: args.paypalCaptureId,
      completedAt: args.completedAt,
    });

    return { sellerId, purchaseId: purchase._id };
  },
});

export const createCollectorPassOrder = action({
  args: {
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const locale = args.locale ?? "es";
    const currentUser = await requireCurrentUser(ctx, locale);

    if (currentUser.seller) {
      throw new Error(t(locale, "error_collector_pass_user_has_seller"));
    }

    const existingPurchase: CollectorPassPurchase | null = await ctx.runQuery(
      internal.collectorPassPurchases.getPurchaseByUserIdInternal,
      { userId: currentUser.user._id },
    );

    if (existingPurchase?.completedAt) {
      throw new Error(t(locale, "error_collector_pass_already_purchased"));
    }

    const accessToken = await getPaypalAccessToken(locale);
    const paypalOrderId = await createPaypalOrder(
      accessToken,
      currentUser.user._id,
      locale,
    );
    const createdAt = Date.now();

    await ctx.runMutation(
      internal.collectorPassPurchases.upsertPendingPurchaseInternal,
      {
        userId: currentUser.user._id,
        paypalOrderId,
        amountCents: COLLECTOR_PASS_AMOUNT_CENTS,
        currency: COLLECTOR_PASS_CURRENCY,
        createdAt,
        locale,
      },
    );

    return {
      orderId: paypalOrderId,
      amountCents: COLLECTOR_PASS_AMOUNT_CENTS,
      currency: COLLECTOR_PASS_CURRENCY,
    };
  },
});

export const captureCollectorPassOrder = action({
  args: {
    paypalOrderId: v.string(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const locale = args.locale ?? "es";
    const currentUser = await requireCurrentUser(ctx, locale);
    const purchase: CollectorPassPurchase | null = await ctx.runQuery(
      internal.collectorPassPurchases.getPurchaseByUserIdInternal,
      { userId: currentUser.user._id },
    );

    if (!purchase) {
      throw new Error(
        t(locale, "error_collector_pass_pending_purchase_not_found"),
      );
    }

    if (purchase.paypalOrderId !== args.paypalOrderId) {
      throw new Error(t(locale, "error_collector_pass_order_mismatch"));
    }

    if (purchase.completedAt && purchase.paypalCaptureId) {
      return {
        ok: true,
        alreadyCompleted: true,
      };
    }

    const accessToken = await getPaypalAccessToken(locale);
    let paypalOrderData: unknown;

    try {
      paypalOrderData = await capturePaypalOrder(
        accessToken,
        args.paypalOrderId,
        locale,
      );
    } catch (error) {
      if (!isOrderAlreadyCapturedError(error)) {
        throw error;
      }

      paypalOrderData = await getPaypalOrder(
        accessToken,
        args.paypalOrderId,
        locale,
      );
    }

    const capture = validateCapturedOrder(
      paypalOrderData,
      args.paypalOrderId,
      locale,
    );

    await ctx.runMutation(
      internal.collectorPassPurchases.finalizePurchaseInternal,
      {
        userId: currentUser.user._id,
        paypalOrderId: args.paypalOrderId,
        paypalCaptureId: capture.paypalCaptureId,
        completedAt: Date.now(),
        locale,
      },
    );

    return {
      ok: true,
      alreadyCompleted: false,
    };
  },
});
