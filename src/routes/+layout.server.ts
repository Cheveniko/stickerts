import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";
import type { LayoutServerLoad } from "./$types";
import { getAuthState } from "$lib/auth/server";

export const load: LayoutServerLoad = async ({ cookies }) => {
  const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);

  return {
    authState: getAuthState(cookies),
    stickers: await convex.query(api.stickers.listActiveStickers, {}),
  };
};
