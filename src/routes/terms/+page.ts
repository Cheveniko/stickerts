import type { PageLoad } from "./$types";
import { createSeoMetadata } from "$lib/seo";
import * as m from "$lib/paraglide/messages";

export const load: PageLoad = () => {
  return {
    seo: createSeoMetadata({
      title: m.seo_terms_title(),
      description: m.seo_terms_description(),
      path: "/terms",
    }),
  };
};
