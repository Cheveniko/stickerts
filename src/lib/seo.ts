import * as m from "$lib/paraglide/messages";
import { localizeHref } from "$lib/paraglide/runtime";

export const SITE_NAME = "Stickerts";
export const SITE_URL = "https://www.stickerts.com";
export const DEFAULT_OG_IMAGE_URL =
  "https://stickerts.s3.us-east-1.amazonaws.com/listings/og-image-2.jpg";

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

function getDefaultSeo(): SeoMetadata {
  return {
    title: m.seo_home_title(),
    description: m.seo_home_description(),
    path: localizeHref("/"),
    ogType: "website",
    robots: "index,follow",
    imageUrl: DEFAULT_OG_IMAGE_URL,
    imageAlt: m.seo_og_image_alt(),
  };
}

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
  const defaultSeo = getDefaultSeo();

  return {
    ...defaultSeo,
    ...metadata,
    path: localizeHref(metadata.path),
  };
}

export function resolveSeoMetadata(
  metadata?: Partial<SeoMetadata> | null,
): ResolvedSeoMetadata {
  const defaultSeo = getDefaultSeo();

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
    imageAlt: resolved.imageAlt ?? defaultSeo.imageAlt ?? m.seo_og_image_alt(),
  };
}
