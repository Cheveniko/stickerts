import * as m from "$lib/paraglide/messages";

const convexErrorMessages = {
  AUTHENTICATION_REQUIRED: m.error_authentication_required,
  INVALID_NAME: m.error_invalid_name,
  SELLER_NOT_FOUND: m.error_seller_not_found,
  INVALID_USERNAME: m.error_invalid_username,
  USERNAME_TAKEN: m.error_username_taken,
  INVALID_DEFAULT_CURRENCY: m.error_invalid_default_currency,
  CITY_NOT_FOUND: m.error_city_not_found,
} as const;

export function getConvexErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    typeof error.data.code === "string"
      ? error.data.code
      : null;

  if (code && code in convexErrorMessages) {
    return convexErrorMessages[code as keyof typeof convexErrorMessages]();
  }

  return m.error_generic_convex();
}
