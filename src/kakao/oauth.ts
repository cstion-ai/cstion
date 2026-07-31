import { z } from "zod";

const KAKAO_TOKEN_EXCHANGE_TIMEOUT_MS = 5_000;

export type KakaoOAuthFailureReason =
  | "provider_response"
  | "invalid_response"
  | "network"
  | "timeout";

export class KakaoOAuthExchangeError extends Error {
  readonly name = "KakaoOAuthExchangeError";

  constructor(
    readonly reason: KakaoOAuthFailureReason,
    readonly statusCode: number | undefined = undefined
  ) {
    super(
      statusCode === undefined
        ? `Kakao token exchange failed: ${reason}`
        : `Kakao token exchange failed with status ${statusCode}`
    );
  }
}

export const KakaoOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().url(),
  clientSecret: z.string().optional(),
  authorizeBaseUrl: z.string().url().default("https://kauth.kakao.com/oauth/authorize"),
  tokenUrl: z.string().url().default("https://kauth.kakao.com/oauth/token")
});

export type KakaoOAuthConfig = z.input<typeof KakaoOAuthConfigSchema>;

export const KakaoTokenResponseSchema = z.object({
  token_type: z.string().min(1),
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
  refresh_token_expires_in: z.number().int().positive().optional(),
  scope: z.string().optional()
});

export type KakaoTokenResponse = z.infer<typeof KakaoTokenResponseSchema>;

export function buildKakaoLoginUrl(config: KakaoOAuthConfig, state: string): string {
  const parsedConfig = KakaoOAuthConfigSchema.parse(config);
  const url = new URL(parsedConfig.authorizeBaseUrl);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", parsedConfig.clientId);
  url.searchParams.set("redirect_uri", parsedConfig.redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeKakaoAuthorizationCode(
  config: KakaoOAuthConfig,
  code: string
): Promise<KakaoTokenResponse> {
  const parsedConfig = KakaoOAuthConfigSchema.parse(config);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: parsedConfig.clientId,
    redirect_uri: parsedConfig.redirectUri,
    code
  });

  if (parsedConfig.clientSecret) {
    body.set("client_secret", parsedConfig.clientSecret);
  }

  let response: Response;
  try {
    response = await fetch(parsedConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body,
      signal: AbortSignal.timeout(KAKAO_TOKEN_EXCHANGE_TIMEOUT_MS)
    });
  } catch (error: unknown) {
    const reason = error instanceof DOMException && error.name === "TimeoutError"
      ? "timeout"
      : "network";
    throw new KakaoOAuthExchangeError(reason);
  }

  if (!response.ok) {
    throw new KakaoOAuthExchangeError("provider_response", response.status);
  }

  try {
    const payload: unknown = await response.json();
    return KakaoTokenResponseSchema.parse(payload);
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new KakaoOAuthExchangeError("invalid_response");
    }
    throw error;
  }
}
