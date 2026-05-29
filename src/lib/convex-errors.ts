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
  CONTACT_LISTING_UNAVAILABLE: "Este cromo ya no esta disponible.",
  CONTACT_TARGET_UNAVAILABLE: "No pudimos preparar este contacto.",
  CONTACT_SELLER_EMAIL_UNAVAILABLE:
    "Este vendedor no tiene un medio de contacto disponible.",
  CONTACT_USER_NOT_FOUND: "No encontramos al usuario actual.",
  CONTACT_FREE_LIMIT_REACHED: "Ya usaste tu contacto con vendedores gratis.",
  CONTACT_RATE_LIMITED:
    "Ya contactaste a este vendedor por esta publicacion en las ultimas 24 horas.",
  CONTACT_MESSAGE_REQUIRED: "Escribe un mensaje antes de enviarlo.",
  CONTACT_MESSAGE_TOO_LONG: "Tu mensaje es demasiado largo.",
  CONTACT_SELF_NOT_ALLOWED: "No puedes contactarte con tu propia publicacion.",
  CONTACT_SEND_FAILED: "No pudimos enviar tu mensaje. Intenta de nuevo.",
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
