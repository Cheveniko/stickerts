import type { PageLoad } from "./$types";
import { createSeoMetadata } from "$lib/seo";

export const load: PageLoad = () => {
  return {
    seo: createSeoMetadata({
      title: "Términos y Condiciones | Stickerts",
      description:
        "Consulta los términos y condiciones que regulan el acceso y uso de la plataforma Stickerts.",
      path: "/terms",
    }),
  };
};
