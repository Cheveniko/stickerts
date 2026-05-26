import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { browser } from "$app/environment";
import { invalidateAll } from "$app/navigation";
import { getContext, setContext } from "svelte";
import { ConvexClient, type ConvexClientOptions } from "convex/browser";
import { setConvexClientContext } from "convex-svelte";
import type { Value } from "convex/values";
import type { ConvexAuthServerState } from "$lib/auth/constants";

const AUTH_CONTEXT = Symbol("convex-auth");

type SignInParams =
  | FormData
  | (Record<string, Value> & {
      redirectTo?: string;
      code?: string;
    });

type SignInResult = {
  signingIn: boolean;
  redirect?: URL;
};

type AuthContext = {
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly token: string | null;
  fetchAccessToken: (opts?: {
    forceRefreshToken?: boolean;
  }) => Promise<string | null>;
  signIn: (provider: string, params?: SignInParams) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

function toObject(params?: SignInParams): Record<string, unknown> {
  if (!params) {
    return {};
  }

  if (params instanceof FormData) {
    return Object.fromEntries(params.entries());
  }

  return params;
}

async function runAuthAction<T>(action: string, args: Record<string, unknown>) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, args }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

export function setupConvexAuth({
  getServerState,
  client,
  convexUrl = PUBLIC_CONVEX_URL,
  options,
}: {
  getServerState: () => ConvexAuthServerState;
  client?: ConvexClient;
  convexUrl?: string;
  options?: ConvexClientOptions;
}) {
  const convexClient =
    client ??
    new ConvexClient(convexUrl, {
      disabled: !browser,
      ...options,
    });

  setConvexClientContext(convexClient);

  const initialServerState = getServerState();
  const serverState = $derived(getServerState());
  const tokenFromServer = $derived(serverState._state.token);
  let tokenOverride = $state<string | null | undefined>(undefined);
  const token = $derived(
    tokenOverride === undefined ? tokenFromServer : tokenOverride,
  );
  let isLoading = $state(false);

  const registerAuth = () =>
    convexClient.setAuth(({ forceRefreshToken }) =>
      fetchAccessToken({ forceRefreshToken }),
    );

  if (initialServerState._state.token !== null) {
    registerAuth();
  }

  async function fetchAccessToken({ forceRefreshToken = false } = {}) {
    if (!forceRefreshToken) {
      return token;
    }

    const result = await runAuthAction<{ tokens: { token: string } | null }>(
      "auth:signIn",
      { refreshToken: "dummy" },
    );

    tokenOverride = result.tokens?.token ?? null;

    return result.tokens?.token ?? null;
  }

  async function signIn(
    provider: string,
    params?: SignInParams,
  ): Promise<SignInResult> {
    isLoading = true;

    try {
      const result = await runAuthAction<{
        redirect?: string;
        tokens?: { token: string } | null;
      }>("auth:signIn", {
        provider,
        params: toObject(params),
      });

      if (result.redirect) {
        const redirect = new URL(result.redirect);
        window.location.href = redirect.toString();
        return { signingIn: false, redirect };
      }

      if (result.tokens !== undefined) {
        tokenOverride = result.tokens?.token ?? null;
        registerAuth();

        await invalidateAll();
        return { signingIn: result.tokens !== null };
      }

      return { signingIn: false };
    } finally {
      isLoading = false;
    }
  }

  async function signOut() {
    isLoading = true;

    try {
      await runAuthAction("auth:signOut", {});
    } finally {
      tokenOverride = null;
      registerAuth();
      isLoading = false;
      await invalidateAll();
    }
  }

  const auth = {
    get isLoading() {
      return isLoading;
    },
    get isAuthenticated() {
      return token !== null;
    },
    get token() {
      return token;
    },
    fetchAccessToken,
    signIn,
    signOut,
  } satisfies AuthContext;

  setContext(AUTH_CONTEXT, auth);

  return auth;
}

export function useAuth() {
  const auth = getContext<AuthContext>(AUTH_CONTEXT);

  if (!auth) {
    throw new Error("setupConvexAuth must be called before useAuth");
  }

  return auth;
}
