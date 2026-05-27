import { createContext } from "svelte";
import { useQuery } from "convex-svelte";
import { api } from "$convex/_generated/api";
import { useAuth } from "$lib/hooks/useAuth.svelte";
import type { CurrentSeller } from "$convex/sellers";
import type { User } from "$convex/users";

export type CurrentUserState =
  | {
      status: "loading";
      user: undefined;
      seller: undefined;
      error: undefined;
    }
  | {
      status: "error";
      user: undefined;
      seller: undefined;
      error: Error;
    }
  | {
      status: "anonymous";
      user: null;
      seller: null;
      error: undefined;
    }
  | {
      status: "authenticated";
      user: User;
      seller: CurrentSeller | null;
      error: undefined;
    };

const [getCurrentUserContext, setCurrentUserContext] =
  createContext<() => CurrentUserState>();

export function setupCurrentUser() {
  const auth = useAuth();
  const query = useQuery(api.users.getCurrentUser, () =>
    auth.isAuthenticated ? {} : "skip",
  );

  const currentUser = $derived.by<CurrentUserState>(() => {
    if (!auth.isAuthenticated) {
      return {
        status: "anonymous",
        user: null,
        seller: null,
        error: undefined,
      };
    }

    if (query.isLoading) {
      return {
        status: "loading",
        user: undefined,
        seller: undefined,
        error: undefined,
      };
    }

    if (query.error) {
      return {
        status: "error",
        user: undefined,
        seller: undefined,
        error: query.error,
      };
    }

    if (query.data) {
      return {
        status: "authenticated",
        user: query.data.user,
        seller: query.data.seller,
        error: undefined,
      };
    }

    return { status: "anonymous", user: null, seller: null, error: undefined };
  });

  setCurrentUserContext(() => currentUser);

  return () => currentUser;
}

export function useCurrentUser() {
  return getCurrentUserContext();
}
