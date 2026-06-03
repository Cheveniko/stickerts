import type { PageLoad } from "./$types";
import { createSeoMetadata } from "$lib/seo";
import * as m from "$lib/paraglide/messages";

export const load: PageLoad = () => {
  return {
    seo: createSeoMetadata({
      title: m.seo_home_title(),
      description: m.seo_home_description(),
      path: "/",
    }),
  };
};
