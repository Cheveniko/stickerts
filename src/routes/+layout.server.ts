import type { LayoutServerLoad } from "./$types";
import { getAuthState } from "$lib/auth/server";

export const load: LayoutServerLoad = async ({ cookies }) => {
  return {
    authState: getAuthState(cookies),
  };
};
