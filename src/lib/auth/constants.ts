export const AUTH_TOKEN_COOKIE = "__convexAuthJWT";
export const AUTH_REFRESH_TOKEN_COOKIE = "__convexAuthRefreshToken";
export const AUTH_VERIFIER_COOKIE = "__convexAuthOAuthVerifier";

export type ConvexAuthServerState = {
  _state: {
    token: string | null;
    refreshToken: string | null;
  };
  _timeFetched: number;
};
