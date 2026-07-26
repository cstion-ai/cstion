import { createHmac, timingSafeEqual } from "node:crypto";

const CONNECT_COOKIE = "kakao_connect_check";
const CONNECT_MAX_AGE_SECONDS = 10 * 60;
const CONNECT_CHECK_CONTEXT = "kakao-oauth-state:v1";

export function createConnectCheck(state: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(CONNECT_CHECK_CONTEXT)
    .update(state)
    .digest("base64url");
}

export function createConnectCookie(check: string, secure: boolean): string {
  return [
    `${CONNECT_COOKIE}=${check}`,
    "Path=/auth/kakao",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${CONNECT_MAX_AGE_SECONDS}`,
    ...(secure ? ["Secure"] : [])
  ].join("; ");
}

export function clearConnectCookie(secure: boolean): string {
  return [
    `${CONNECT_COOKIE}=`,
    "Path=/auth/kakao",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(secure ? ["Secure"] : [])
  ].join("; ");
}

export function hasValidConnectCheck(
  callbackState: string | null,
  cookieHeader: string | undefined,
  secret: string
): boolean {
  if (!callbackState || !cookieHeader) return false;
  const cookieCheck = readCookie(cookieHeader, CONNECT_COOKIE);
  if (!cookieCheck) return false;

  const expected = Buffer.from(createConnectCheck(callbackState, secret));
  const received = Buffer.from(cookieCheck);
  return expected.byteLength === received.byteLength
    && timingSafeEqual(expected, received);
}

function readCookie(header: string, name: string): string | undefined {
  for (const cookie of header.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;
    return cookie.slice(separator + 1).trim();
  }
  return undefined;
}
