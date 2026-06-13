import { normalizeLocale, type AppLocale } from "./i18n";

const messages = {
  es: {
    error_authentication_required: "Debes iniciar sesión para hacer esto.",
    error_invalid_name: "Ingresa un nombre válido.",
    error_seller_not_found: "No encontramos tu perfil de vendedor.",
    error_invalid_username:
      "El username debe tener entre 3 y 30 caracteres y solo puede usar letras, números y guion bajo.",
    error_username_taken: "Este username ya está en uso.",
    error_invalid_default_currency: "Selecciona una moneda válida.",
    error_city_not_found: "No encontramos la ciudad seleccionada.",
    error_seller_inactive:
      "Tu cuenta seller no puede publicar cromos en este momento.",
    error_sticker_not_found: "No encontramos el cromo seleccionado.",
    error_listing_not_found: "No encontramos la publicación seleccionada.",
    error_listing_removed: "Esta publicación ya no se puede editar.",
    error_sale_listing_not_for_sale:
      "Esta publicación no está disponible para registrar ventas.",
    error_sale_quantity_unavailable:
      "No puedes registrar más unidades de las disponibles.",
    error_invalid_currency: "La moneda debe ser un código ISO de 3 letras.",
    error_invalid_price: "El precio debe ser mayor a 0.",
    error_invalid_quantity: "La cantidad debe ser mayor a 0.",
    error_invalid_image_key:
      "La imagen seleccionada no pertenece a este seller.",
    error_wanted_sticker_not_found:
      "Uno de los cromos solicitados para intercambio no existe.",
    error_contact_listing_unavailable: "Este cromo ya no está disponible.",
    error_contact_target_unavailable: "No pudimos preparar este contacto.",
    error_contact_seller_email_unavailable:
      "Este vendedor no tiene un medio de contacto disponible.",
    error_contact_user_not_found: "No encontramos al usuario actual.",
    error_contact_free_limit_reached:
      "Ya usaste tu contacto con vendedores gratis.",
    error_contact_rate_limited:
      "Ya contactaste a este vendedor por esta publicación en las últimas 24 horas.",
    error_contact_method_required: "Selecciona cómo quieres que te contacten.",
    error_contact_value_required:
      "Ingresa tu dato de contacto antes de enviarlo.",
    error_contact_email_invalid: "Ingresa un email válido.",
    error_contact_phone_invalid: "Ingresa un número de WhatsApp válido.",
    error_contact_message_too_long: "Tu mensaje es demasiado largo.",
    error_contact_self_not_allowed:
      "No puedes contactarte con tu propia publicación.",
    error_contact_send_failed:
      "No pudimos enviar tu mensaje. Intenta de nuevo.",
    error_username_generation_failed:
      "No pudimos generar un username disponible para este seller.",
    error_seller_activation_user_not_found:
      "No encontramos el usuario para activar el perfil seller.",
    error_paypal_invalid_amount: "PayPal devolvió un monto inválido.",
    error_paypal_not_configured:
      "PayPal no está configurado para procesar el Pase de Coleccionista.",
    error_paypal_request_rejected:
      "PayPal rechazó la solicitud del Pase de Coleccionista.",
    error_paypal_invalid_token: "PayPal no devolvió un token válido.",
    error_paypal_invalid_order_id: "PayPal no devolvió un order id válido.",
    error_paypal_validate_order_failed:
      "No pudimos validar la orden de PayPal.",
    error_paypal_order_not_completed:
      "PayPal no marcó la orden como completada.",
    error_paypal_invalid_purchase_units:
      "PayPal no devolvió unidades de compra válidas.",
    error_paypal_invalid_purchase_unit:
      "PayPal no devolvió una unidad de compra válida.",
    error_paypal_missing_order_amount:
      "PayPal no devolvió el monto de la orden.",
    error_paypal_order_amount_mismatch:
      "El monto de la orden de PayPal no coincide con el Pase de Coleccionista.",
    error_paypal_missing_capture: "PayPal no devolvió la captura del pago.",
    error_paypal_invalid_capture_id: "PayPal no devolvió un capture id válido.",
    error_paypal_capture_not_completed:
      "PayPal no completó la captura del pago.",
    error_paypal_missing_capture_amount:
      "PayPal no devolvió el monto capturado.",
    error_paypal_capture_amount_mismatch:
      "El monto capturado en PayPal no coincide con el Pase de Coleccionista.",
    error_collector_pass_auth_required:
      "Debes iniciar sesión para comprar el Pase de Coleccionista.",
    error_collector_pass_user_has_seller:
      "Tu perfil ya tiene acceso de seller activo.",
    error_collector_pass_already_purchased:
      "Ya compraste el Pase de Coleccionista.",
    error_collector_pass_pending_purchase_not_found:
      "No encontramos una compra pendiente del Pase de Coleccionista.",
    error_collector_pass_order_mismatch:
      "La orden de PayPal no coincide con la compra pendiente.",
    error_collector_pass_capture_processed:
      "Esta captura de PayPal ya fue procesada.",
    error_collector_pass_completed_with_other_capture:
      "Esta compra ya fue completada con otra captura de PayPal.",
    error_collector_pass_pending_purchase_user_not_found:
      "No encontramos una compra pendiente para este usuario.",
    collector_pass_order_description: "Pase de Coleccionista Stickerts 2026",
    email_login_subject: "Tu acceso a Stickerts",
    email_login_text: "Entra a Stickerts con este link:\n\n{url}\n",
    email_login_html_intro: "Entra a Stickerts con este link:",
    email_contact_subject: "Nuevo interesado en tu cromo {stickerName}",
    email_contact_greeting: "Hola {sellerName},",
    email_contact_intro:
      "Recibiste un nuevo mensaje sobre tu cromo {stickerName} en Stickerts.",
    email_contact_buyer_channel:
      "Puedes contactarte con la persona interesada por {channel} en:",
    common_email: "email",
    common_whatsapp: "WhatsApp",
  },
  en: {
    error_authentication_required: "You need to sign in to do this.",
    error_invalid_name: "Enter a valid name.",
    error_seller_not_found: "We couldn't find your seller profile.",
    error_invalid_username:
      "Username must be 3 to 30 characters and can only use letters, numbers, and underscores.",
    error_username_taken: "This username is already in use.",
    error_invalid_default_currency: "Select a valid currency.",
    error_city_not_found: "We couldn't find the selected city.",
    error_seller_inactive:
      "Your seller account can't publish stickers right now.",
    error_sticker_not_found: "We couldn't find the selected sticker.",
    error_listing_not_found: "We couldn't find the selected listing.",
    error_listing_removed: "This listing can no longer be edited.",
    error_sale_listing_not_for_sale:
      "This listing is not available for recording sales.",
    error_sale_quantity_unavailable:
      "You can't record more units than are available.",
    error_invalid_currency: "Currency must be a 3-letter ISO code.",
    error_invalid_price: "Price must be greater than 0.",
    error_invalid_quantity: "Quantity must be greater than 0.",
    error_invalid_image_key:
      "The selected image doesn't belong to this seller.",
    error_wanted_sticker_not_found:
      "One of the requested trade stickers doesn't exist.",
    error_contact_listing_unavailable: "This sticker is no longer available.",
    error_contact_target_unavailable: "We couldn't prepare this contact.",
    error_contact_seller_email_unavailable:
      "This seller doesn't have an available contact method.",
    error_contact_user_not_found: "We couldn't find the current user.",
    error_contact_free_limit_reached:
      "You've already used your free seller contact.",
    error_contact_rate_limited:
      "You've already contacted this seller for this listing in the last 24 hours.",
    error_contact_method_required: "Choose how you'd like to be contacted.",
    error_contact_value_required: "Enter your contact details before sending.",
    error_contact_email_invalid: "Enter a valid email address.",
    error_contact_phone_invalid: "Enter a valid WhatsApp number.",
    error_contact_message_too_long: "Your message is too long.",
    error_contact_self_not_allowed: "You can't contact your own listing.",
    error_contact_send_failed:
      "We couldn't send your message. Please try again.",
    error_username_generation_failed:
      "We couldn't generate an available username for this seller.",
    error_seller_activation_user_not_found:
      "We couldn't find the user to activate the seller profile.",
    error_paypal_invalid_amount: "PayPal returned an invalid amount.",
    error_paypal_not_configured:
      "PayPal isn't configured to process the Collector Pass.",
    error_paypal_request_rejected:
      "PayPal rejected the Collector Pass request.",
    error_paypal_invalid_token: "PayPal didn't return a valid token.",
    error_paypal_invalid_order_id: "PayPal didn't return a valid order id.",
    error_paypal_validate_order_failed:
      "We couldn't validate the PayPal order.",
    error_paypal_order_not_completed:
      "PayPal didn't mark the order as completed.",
    error_paypal_invalid_purchase_units:
      "PayPal didn't return valid purchase units.",
    error_paypal_invalid_purchase_unit:
      "PayPal didn't return a valid purchase unit.",
    error_paypal_missing_order_amount: "PayPal didn't return the order amount.",
    error_paypal_order_amount_mismatch:
      "The PayPal order amount doesn't match the Collector Pass.",
    error_paypal_missing_capture: "PayPal didn't return the payment capture.",
    error_paypal_invalid_capture_id: "PayPal didn't return a valid capture id.",
    error_paypal_capture_not_completed:
      "PayPal didn't complete the payment capture.",
    error_paypal_missing_capture_amount:
      "PayPal didn't return the captured amount.",
    error_paypal_capture_amount_mismatch:
      "The captured PayPal amount doesn't match the Collector Pass.",
    error_collector_pass_auth_required:
      "You need to sign in to buy the Collector Pass.",
    error_collector_pass_user_has_seller:
      "Your profile already has active seller access.",
    error_collector_pass_already_purchased:
      "You've already purchased the Collector Pass.",
    error_collector_pass_pending_purchase_not_found:
      "We couldn't find a pending Collector Pass purchase.",
    error_collector_pass_order_mismatch:
      "The PayPal order doesn't match the pending purchase.",
    error_collector_pass_capture_processed:
      "This PayPal capture was already processed.",
    error_collector_pass_completed_with_other_capture:
      "This purchase was already completed with a different PayPal capture.",
    error_collector_pass_pending_purchase_user_not_found:
      "We couldn't find a pending purchase for this user.",
    collector_pass_order_description: "Stickerts Collector Pass 2026",
    email_login_subject: "Your Stickerts access",
    email_login_text: "Sign in to Stickerts with this link:\n\n{url}\n",
    email_login_html_intro: "Sign in to Stickerts with this link:",
    email_contact_subject:
      "New interested buyer for your sticker {stickerName}",
    email_contact_greeting: "Hi {sellerName},",
    email_contact_intro:
      "You received a new message about your sticker {stickerName} on Stickerts.",
    email_contact_buyer_channel:
      "You can contact the interested person via {channel} at:",
    common_email: "email",
    common_whatsapp: "WhatsApp",
  },
} as const;

type BackendLocale = keyof typeof messages;
export type BackendMessageKey = keyof (typeof messages)["es"];

function interpolate(
  template: string,
  params: Record<string, string | number | undefined>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function t(
  locale: AppLocale | string | null | undefined,
  key: BackendMessageKey,
  params: Record<string, string | number | undefined> = {},
) {
  const normalizedLocale = normalizeLocale(locale) as BackendLocale;
  return interpolate(messages[normalizedLocale][key], params);
}
