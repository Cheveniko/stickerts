export const appLocales = ["es", "en"] as const;

export type AppLocale = (typeof appLocales)[number];

export function normalizeLocale(locale?: string | null): AppLocale {
  return locale === "en" ? "en" : "es";
}

export function getLocaleFromUrl(url: string): AppLocale {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname === "/en" || parsedUrl.pathname.startsWith("/en/")) {
      return "en";
    }

    const nestedUrl =
      parsedUrl.searchParams.get("callbackUrl") ??
      parsedUrl.searchParams.get("redirectTo");

    if (nestedUrl) {
      return getLocaleFromUrl(nestedUrl);
    }
  } catch {
    if (url === "/en" || url.startsWith("/en/")) {
      return "en";
    }
  }

  return "es";
}
