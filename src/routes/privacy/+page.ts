import type { PageLoad } from "./$types";
import { createSeoMetadata } from "$lib/seo";

export const load: PageLoad = () => {
  return {
    seo: createSeoMetadata({
      title: "Política de Privacidad | Stickerts",
      description:
        "Conoce cómo Stickerts recopila, utiliza y protege los datos personales de los usuarios en la plataforma.",
      path: "/privacy",
    }),
  };
};
