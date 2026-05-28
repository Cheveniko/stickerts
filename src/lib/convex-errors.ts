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
  SELLER_INACTIVE: "Tu cuenta seller no puede publicar cromos en este momento.",
  STICKER_NOT_FOUND: "No encontramos el cromo seleccionado.",
  LISTING_NOT_FOUND: "No encontramos la publicacion seleccionada.",
  LISTING_REMOVED: "Esta publicacion ya no se puede editar.",
  INVALID_CURRENCY: "La moneda debe ser un codigo ISO de 3 letras.",
  INVALID_PRICE: "El precio debe ser mayor a 0.",
  INVALID_QUANTITY: "La cantidad debe ser mayor a 0.",
  INVALID_IMAGE_KEY: "La imagen seleccionada no pertenece a este seller.",
  WANTED_STICKER_NOT_FOUND:
    "Uno de los cromos solicitados para intercambio no existe.",
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
    ];
  }

  return m.error_generic_convex();
}
