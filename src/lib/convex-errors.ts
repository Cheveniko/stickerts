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

const directConvexErrorMessages = {
  SELLER_INACTIVE: m.error_seller_inactive,
  STICKER_NOT_FOUND: m.error_sticker_not_found,
  LISTING_NOT_FOUND: m.error_listing_not_found,
  LISTING_REMOVED: m.error_listing_removed,
  INVALID_CURRENCY: m.error_invalid_currency,
  INVALID_PRICE: m.error_invalid_price,
  INVALID_QUANTITY: m.error_invalid_quantity,
  INVALID_IMAGE_KEY: m.error_invalid_image_key,
  WANTED_STICKER_NOT_FOUND: m.error_wanted_sticker_not_found,
  CONTACT_LISTING_UNAVAILABLE: m.error_contact_listing_unavailable,
  CONTACT_TARGET_UNAVAILABLE: m.error_contact_target_unavailable,
  CONTACT_SELLER_EMAIL_UNAVAILABLE: m.error_contact_seller_email_unavailable,
  CONTACT_USER_NOT_FOUND: m.error_contact_user_not_found,
  CONTACT_FREE_LIMIT_REACHED: m.error_contact_free_limit_reached,
  CONTACT_RATE_LIMITED: m.error_contact_rate_limited,
  CONTACT_MESSAGE_REQUIRED: m.error_contact_message_required,
  CONTACT_MESSAGE_TOO_LONG: m.error_contact_message_too_long,
  CONTACT_SELF_NOT_ALLOWED: m.error_contact_self_not_allowed,
  CONTACT_SEND_FAILED: m.error_contact_send_failed,
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

  if (code && code in directConvexErrorMessages) {
    return directConvexErrorMessages[
      code as keyof typeof directConvexErrorMessages
    ]();
  }

  return m.error_generic_convex();
}
