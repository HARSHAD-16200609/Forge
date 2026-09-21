import { CookieOptions, Request, Response } from "express";

const COOKIE_NAME = "oauth_transaction";
const TTL_MS = 5 * 60 * 1000;

export type OAuthTransactionPayload =
  | { state: string }
  | { state: string; codeVerifier: string };

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  signed: true,
  maxAge: TTL_MS,
};

const clearOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export function setOAuthTransactionCookie(res: Response, payload: OAuthTransactionPayload): void {
  res.cookie(COOKIE_NAME, JSON.stringify({ ...payload, exp: Date.now() + TTL_MS }), cookieOptions);
}

export function readOAuthTransactionCookie(req: Request): OAuthTransactionPayload | null {
  const raw = req.signedCookies[COOKIE_NAME];
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as { state?: unknown; codeVerifier?: unknown; exp?: unknown };

    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.state !== "string") return null;
    if (parsed.codeVerifier !== undefined && typeof parsed.codeVerifier !== "string") return null;
    if (typeof parsed.exp !== "number" || Date.now() >= parsed.exp) return null;

    return parsed as OAuthTransactionPayload;
  } catch {
    return null;
  }
}

export function clearOAuthTransactionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, clearOptions);
}