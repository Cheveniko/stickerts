import type { PageLoad } from "./$types";
import { createSeoMetadata } from "$lib/seo";

export const load: PageLoad = () => {
  return {
    seo: createSeoMetadata({
      title: "Stickerts | Compra, vende e intercambia cromos",
      description:
        "Conecta con otros coleccionistas para comprar, vender e intercambiar cromos y completar tu álbum en Stickerts.",
      path: "/",
    }),
  };
};
