/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as cities from "../cities.js";
import type * as collectorPassPurchases from "../collectorPassPurchases.js";
import type * as http from "../http.js";
import type * as listings from "../listings.js";
import type * as locationSeed from "../locationSeed.js";
import type * as purchaseInquiries from "../purchaseInquiries.js";
import type * as resend from "../resend.js";
import type * as sellers from "../sellers.js";
import type * as stickers from "../stickers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  cities: typeof cities;
  collectorPassPurchases: typeof collectorPassPurchases;
  http: typeof http;
  listings: typeof listings;
  locationSeed: typeof locationSeed;
  purchaseInquiries: typeof purchaseInquiries;
  resend: typeof resend;
  sellers: typeof sellers;
  stickers: typeof stickers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
