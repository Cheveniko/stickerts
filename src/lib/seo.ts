export const SITE_NAME = "Stickerts";
export const SITE_URL = "https://www.stickerts.com";
export const DEFAULT_OG_IMAGE_URL =
  "https://stickerts.s3.us-east-1.amazonaws.com/listings/og-image-stickerts.jpg";

export type SeoMetadata = {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  robots?: string;
  imagePath?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type ResolvedSeoMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: "website" | "article";
  robots: string;
  imageUrl: string;
  imageAlt: string;
};

const defaultSeo: SeoMetadata = {
  title: "Stickerts | Compra, vende e intercambia cromos",
  description:
    "Conecta con otros coleccionistas para comprar, vender e intercambiar cromos y completar tu álbum en Stickerts.",
  path: "/",
  ogType: "website",
  robots: "index,follow",
  imageUrl: DEFAULT_OG_IMAGE_URL,
  imageAlt: "Stickerts",
};

export function buildAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function resolveImageUrl(metadata: SeoMetadata) {
  if (metadata.imageUrl) {
    return metadata.imageUrl;
  }

  if (metadata.imagePath) {
    return buildAbsoluteUrl(metadata.imagePath);
  }

  return DEFAULT_OG_IMAGE_URL;
}

export function createSeoMetadata(metadata: SeoMetadata): SeoMetadata {
  return {
    ...defaultSeo,
    ...metadata,
  };
}

export function resolveSeoMetadata(
  metadata?: Partial<SeoMetadata> | null,
): ResolvedSeoMetadata {
  const resolved = {
    ...defaultSeo,
    ...metadata,
  } satisfies SeoMetadata;

  return {
    title: resolved.title,
    description: resolved.description,
    canonicalUrl: buildAbsoluteUrl(resolved.path),
    ogType: resolved.ogType ?? "website",
    robots: resolved.robots ?? "index,follow",
    imageUrl: resolveImageUrl(resolved),
    imageAlt:
      resolved.imageAlt ?? defaultSeo.imageAlt ?? "Imagen de Open Graph",
  };
}
