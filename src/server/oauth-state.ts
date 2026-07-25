import { timingSafeEqual } from "node:crypto";

const OAUTH_STATE_COOKIE = "kakao_oauth_state";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export function createOAuthStateCookie(state: string, secure: boolean): string {
  return [
    `${OAUTH_STATE_COOKIE}=${state}`,
    "Path=/auth/kakao",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`,
    ...(secure ? ["Secure"] : [])
  ].join("; ");
}

export function clearOAuthStateCookie(secure: boolean): string {
  return [
    `${OAUTH_STATE_COOKIE}=`,
    "Path=/auth/kakao",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(secure ? ["Secure"] : [])
  ].join("; ");
}

export function isValidOAuthState(
  callbackState: string | null,
  cookieHeader: string | undefined
): boolean {
  if (!callbackState || !cookieHeader) return false;
  const cookieState = readCookie(cookieHeader, OAUTH_STATE_COOKIE);
  if (!cookieState) return false;

  const callbackBuffer = Buffer.from(callbackState);
  const cookieBuffer = Buffer.from(cookieState);
  return callbackBuffer.byteLength === cookieBuffer.byteLength
    && timingSafeEqual(callbackBuffer, cookieBuffer);
}

function readCookie(header: string, name: string): string | undefined {
  for (const cookie of header.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;
    return cookie.slice(separator + 1).trim();
  }
  return undefined;
}
