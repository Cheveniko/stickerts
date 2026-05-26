import {
  json,
  redirect,
  type Cookies,
  type Handle,
  type RequestEvent,
} from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_VERIFIER_COOKIE,
  type ConvexAuthServerState,
} from "$lib/auth/constants";

const authCookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function createConvexHttpClient(token?: string) {
  const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

  if (token) {
    client.setAuth(token);
  }

  return client;
}

function setAuthCookies(
  cookies: Cookies,
  tokens: { token: string; refreshToken: string } | null,
) {
  if (!tokens) {
    cookies.delete(AUTH_TOKEN_COOKIE, authCookieOptions);
    cookies.delete(AUTH_REFRESH_TOKEN_COOKIE, authCookieOptions);
    return;
  }

  cookies.set(AUTH_TOKEN_COOKIE, tokens.token, {
    ...authCookieOptions,
    maxAge: 60 * 60,
  });
  cookies.set(AUTH_REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearVerifierCookie(cookies: Cookies) {
  cookies.delete(AUTH_VERIFIER_COOKIE, authCookieOptions);
}

function normalizeAuthActionArgs(
  args: Record<string, unknown>,
  event: RequestEvent,
) {
  const normalizedArgs = structuredClone(args);

  if (normalizedArgs.refreshToken !== undefined) {
    normalizedArgs.refreshToken = event.cookies.get(AUTH_REFRESH_TOKEN_COOKIE);
  }

  if (
    typeof normalizedArgs.params === "object" &&
    normalizedArgs.params !== null &&
    "code" in normalizedArgs.params &&
    normalizedArgs.verifier === undefined
  ) {
    normalizedArgs.verifier =
      event.cookies.get(AUTH_VERIFIER_COOKIE) ?? undefined;
  }

  return normalizedArgs;
}

async function proxyAuthAction(event: RequestEvent) {
  const { action, args = {} } = (await event.request.json()) as {
    action?: string;
    args?: Record<string, unknown>;
  };

  if (action !== "auth:signIn" && action !== "auth:signOut") {
    return new Response("Invalid auth action", { status: 400 });
  }

  if (action === "auth:signOut") {
    const token = event.cookies.get(AUTH_TOKEN_COOKIE) ?? undefined;

    try {
      await createConvexHttpClient(token).action(api.auth.signOut, {});
    } catch {
      // The client can still clear its local state if sign out fails remotely.
    }

    setAuthCookies(event.cookies, null);
    clearVerifierCookie(event.cookies);
    return json(null);
  }

  const normalizedArgs = normalizeAuthActionArgs(args, event);
  const token =
    normalizedArgs.refreshToken !== undefined ||
    (typeof normalizedArgs.params === "object" &&
      normalizedArgs.params !== null &&
      "code" in normalizedArgs.params)
      ? undefined
      : (event.cookies.get(AUTH_TOKEN_COOKIE) ?? undefined);

  try {
    const result = await createConvexHttpClient(token).action(
      api.auth.signIn,
      normalizedArgs,
    );

    if (result.redirect) {
      if (result.verifier) {
        event.cookies.set(AUTH_VERIFIER_COOKIE, result.verifier, {
          ...authCookieOptions,
          maxAge: 60 * 5,
        });
      }

      return json({ redirect: result.redirect });
    }

    if (result.tokens !== undefined) {
      setAuthCookies(event.cookies, result.tokens ?? null);
      clearVerifierCookie(event.cookies);

      return json({
        tokens: result.tokens
          ? {
              token: result.tokens.token,
              refreshToken: "dummy",
            }
          : null,
      });
    }

    return json(result);
  } catch (error) {
    setAuthCookies(event.cookies, null);
    clearVerifierCookie(event.cookies);

    if (error instanceof Error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response("Authentication failed", { status: 400 });
  }
}

async function handleMagicLinkCode(event: RequestEvent) {
  const code = event.url.searchParams.get("code");

  if (
    !code ||
    event.request.method !== "GET" ||
    !event.request.headers.get("accept")?.includes("text/html")
  ) {
    return null;
  }

  const cleanUrl = new URL(event.url);
  cleanUrl.searchParams.delete("code");

  try {
    const result = await createConvexHttpClient().action(api.auth.signIn, {
      params: { code },
      verifier: event.cookies.get(AUTH_VERIFIER_COOKIE) ?? undefined,
    });

    setAuthCookies(event.cookies, result.tokens ?? null);
    clearVerifierCookie(event.cookies);
  } catch (error) {
    console.error("[auth] Failed to exchange magic link code", error);
    clearVerifierCookie(event.cookies);
  }

  throw redirect(303, cleanUrl.toString());
}

export function getAuthState(cookies: Cookies): ConvexAuthServerState {
  return {
    _state: {
      token: cookies.get(AUTH_TOKEN_COOKIE) ?? null,
      refreshToken: cookies.get(AUTH_REFRESH_TOKEN_COOKIE) ?? null,
    },
    _timeFetched: Date.now(),
  };
}

export const handleAuth: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/api/auth" && event.request.method === "POST") {
    return await proxyAuthAction(event);
  }

  await handleMagicLinkCode(event);

  return await resolve(event);
};
