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
import { activateSellerForCollectorPass } from "./sellers";
import type { CurrentUserData } from "./users";

const COLLECTOR_PASS_AMOUNT_CENTS = 199;
const COLLECTOR_PASS_CURRENCY = "USD";
const COLLECTOR_PASS_DESCRIPTION = "Pase de Coleccionista Stickerts 2026";

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

function parseAmountCents(value: string) {
  const normalizedValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error("PayPal devolvio un monto invalido.");
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

function getPaypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal no esta configurado para procesar el Pase de Coleccionista.",
    );
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

async function paypalRequest(path: string, init: RequestInit) {
  const response = await fetch(`${getPaypalBaseUrl()}${path}`, init);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new PaypalApiError(
      response.status,
      data,
      extractPaypalErrorMessage(data) ??
        "PayPal rechazo la solicitud del Pase de Coleccionista.",
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

async function getPaypalAccessToken() {
  const { clientId, clientSecret } = getPaypalCredentials();
  const data = await paypalRequest("/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: buildPaypalAuthorization(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (
    !isRecord(data) ||
    typeof data.access_token !== "string" ||
    !data.access_token
  ) {
    throw new Error("PayPal no devolvio un token valido.");
  }

  return data.access_token;
}

async function createPaypalOrder(accessToken: string, userId: string) {
  const data = await paypalRequest("/v2/checkout/orders", {
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
          description: COLLECTOR_PASS_DESCRIPTION,
          custom_id: userId,
          amount: {
            currency_code: COLLECTOR_PASS_CURRENCY,
            value: formatAmountCents(COLLECTOR_PASS_AMOUNT_CENTS),
          },
        },
      ],
    }),
  });

  if (!isRecord(data) || typeof data.id !== "string" || !data.id.trim()) {
    throw new Error("PayPal no devolvio un order id valido.");
  }

  return data.id;
}

async function capturePaypalOrder(accessToken: string, orderId: string) {
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
  );
}

async function getPaypalOrder(accessToken: string, orderId: string) {
  return await paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
}

function validateCapturedOrder(
  data: unknown,
  expectedOrderId: string,
) {
  if (!isRecord(data) || data.id !== expectedOrderId) {
    throw new Error("No pudimos validar la orden de PayPal.");
  }

  if (data.status !== "COMPLETED") {
    throw new Error("PayPal no marco la orden como completada.");
  }

  if (!Array.isArray(data.purchase_units) || data.purchase_units.length === 0) {
    throw new Error("PayPal no devolvio unidades de compra validas.");
  }

  const purchaseUnit = data.purchase_units[0];

  if (!isRecord(purchaseUnit)) {
    throw new Error("PayPal no devolvio una unidad de compra valida.");
  }

  if (!isRecord(purchaseUnit.amount)) {
    throw new Error("PayPal no devolvio el monto de la orden.");
  }

  const orderAmountCents = parseAmountCents(
    String(purchaseUnit.amount.value ?? ""),
  );
  const orderCurrency = String(purchaseUnit.amount.currency_code ?? "");

  if (
    orderAmountCents !== COLLECTOR_PASS_AMOUNT_CENTS ||
    orderCurrency !== COLLECTOR_PASS_CURRENCY
  ) {
    throw new Error(
      "El monto de la orden de PayPal no coincide con el Pase de Coleccionista.",
    );
  }

  if (
    !isRecord(purchaseUnit.payments) ||
    !Array.isArray(purchaseUnit.payments.captures)
  ) {
    throw new Error("PayPal no devolvio la captura del pago.");
  }

  const capture = purchaseUnit.payments.captures[0];

  if (
    !isRecord(capture) ||
    typeof capture.id !== "string" ||
    !capture.id.trim()
  ) {
    throw new Error("PayPal no devolvio un capture id valido.");
  }

  if (capture.status !== "COMPLETED") {
    throw new Error("PayPal no completo la captura del pago.");
  }

  if (!isRecord(capture.amount)) {
    throw new Error("PayPal no devolvio el monto capturado.");
  }

  const captureAmountCents = parseAmountCents(
    String(capture.amount.value ?? ""),
  );
  const captureCurrency = String(capture.amount.currency_code ?? "");

  if (
    captureAmountCents !== COLLECTOR_PASS_AMOUNT_CENTS ||
    captureCurrency !== COLLECTOR_PASS_CURRENCY
  ) {
    throw new Error(
      "El monto capturado en PayPal no coincide con el Pase de Coleccionista.",
    );
  }

  return {
    paypalCaptureId: capture.id,
    amountCents: captureAmountCents,
    currency: captureCurrency,
  };
}

async function requireCurrentUser(ctx: ActionCtx) {
  const currentUser: CurrentUserData | null = await ctx.runQuery(
    api.users.getCurrentUser,
    {},
  );

  if (!currentUser) {
    throw new Error(
      "Debes iniciar sesion para comprar el Pase de Coleccionista.",
    );
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
  },
  handler: async (ctx, args) => {
    const existingPurchase = await getPurchaseByUserId(ctx, args.userId);

    if (existingPurchase) {
      if (existingPurchase.completedAt) {
        throw new Error("Este usuario ya compro el Pase de Coleccionista.");
      }

      await ctx.db.patch(existingPurchase._id, {
        paypalOrderId: args.paypalOrderId,
        amountCents: args.amountCents,
        currency: args.currency,
        createdAt: args.createdAt,
      });

      return existingPurchase._id;
    }

    return await ctx.db.insert("collectorPassPurchases", args);
  },
});

export const finalizePurchaseInternal = internalMutation({
  args: {
    userId: v.id("users"),
    paypalOrderId: v.string(),
    paypalCaptureId: v.string(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const purchase = await getPurchaseByUserId(ctx, args.userId);

    if (!purchase) {
      throw new Error("No encontramos una compra pendiente para este usuario.");
    }

    if (purchase.paypalOrderId !== args.paypalOrderId) {
      throw new Error(
        "La orden de PayPal no coincide con la compra pendiente.",
      );
    }

    const duplicateCapture = await getPurchaseByPaypalCaptureId(
      ctx,
      args.paypalCaptureId,
    );

    if (duplicateCapture && duplicateCapture._id !== purchase._id) {
      throw new Error("Esta captura de PayPal ya fue procesada.");
    }

    if (purchase.completedAt) {
      if (purchase.paypalCaptureId !== args.paypalCaptureId) {
        throw new Error(
          "Esta compra ya fue completada con otra captura de PayPal.",
        );
      }

      const sellerId = await activateSellerForCollectorPass(
        ctx,
        args.userId,
        purchase.completedAt,
      );

      return { sellerId, purchaseId: purchase._id };
    }

    const sellerId = await activateSellerForCollectorPass(
      ctx,
      args.userId,
      args.completedAt,
    );

    await ctx.db.patch(purchase._id, {
      paypalCaptureId: args.paypalCaptureId,
      completedAt: args.completedAt,
    });

    return { sellerId, purchaseId: purchase._id };
  },
});

export const createCollectorPassOrder = action({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireCurrentUser(ctx);

    if (currentUser.seller) {
      throw new Error("Tu perfil ya tiene acceso de seller activo.");
    }

    const existingPurchase: CollectorPassPurchase | null = await ctx.runQuery(
      internal.collectorPassPurchases.getPurchaseByUserIdInternal,
      { userId: currentUser.user._id },
    );

    if (existingPurchase?.completedAt) {
      throw new Error("Ya compraste el Pase de Coleccionista.");
    }

    const accessToken = await getPaypalAccessToken();
    const paypalOrderId = await createPaypalOrder(
      accessToken,
      currentUser.user._id,
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
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const purchase: CollectorPassPurchase | null = await ctx.runQuery(
      internal.collectorPassPurchases.getPurchaseByUserIdInternal,
      { userId: currentUser.user._id },
    );

    if (!purchase) {
      throw new Error(
        "No encontramos una compra pendiente del Pase de Coleccionista.",
      );
    }

    if (purchase.paypalOrderId !== args.paypalOrderId) {
      throw new Error(
        "La orden de PayPal no coincide con la compra pendiente.",
      );
    }

    if (purchase.completedAt && purchase.paypalCaptureId) {
      return {
        ok: true,
        alreadyCompleted: true,
      };
    }

    const accessToken = await getPaypalAccessToken();
    let paypalOrderData: unknown;

    try {
      paypalOrderData = await capturePaypalOrder(
        accessToken,
        args.paypalOrderId,
      );
    } catch (error) {
      if (!isOrderAlreadyCapturedError(error)) {
        throw error;
      }

      paypalOrderData = await getPaypalOrder(accessToken, args.paypalOrderId);
    }

    const capture = validateCapturedOrder(
      paypalOrderData,
      args.paypalOrderId,
    );

    await ctx.runMutation(
      internal.collectorPassPurchases.finalizePurchaseInternal,
      {
        userId: currentUser.user._id,
        paypalOrderId: args.paypalOrderId,
        paypalCaptureId: capture.paypalCaptureId,
        completedAt: Date.now(),
      },
    );

    return {
      ok: true,
      alreadyCompleted: false,
    };
  },
});
