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
import type * as contacts from "../contacts.js";
import type * as http from "../http.js";
import type * as i18n from "../i18n.js";
import type * as listings from "../listings.js";
import type * as locationSeed from "../locationSeed.js";
import type * as messages from "../messages.js";
import type * as resend from "../resend.js";
import type * as sales from "../sales.js";
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
  contacts: typeof contacts;
  http: typeof http;
  i18n: typeof i18n;
  listings: typeof listings;
  locationSeed: typeof locationSeed;
  messages: typeof messages;
  resend: typeof resend;
  sales: typeof sales;
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
