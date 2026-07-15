import { z } from "zod";

export const KakaoOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().url(),
  clientSecret: z.string().optional(),
  authorizeBaseUrl: z.string().url().default("https://kauth.kakao.com/oauth/authorize"),
  tokenUrl: z.string().url().default("https://kauth.kakao.com/oauth/token")
});

export type KakaoOAuthConfig = z.input<typeof KakaoOAuthConfigSchema>;

export const KakaoTokenResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  refresh_token_expires_in: z.number().optional(),
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
  url.searchParams.set("scope", "profile_nickname,account_email,phone_number");

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

  const response = await fetch(parsedConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body
  });

  if (!response.ok) {
    throw new Error(`Kakao token exchange failed: ${response.status}`);
  }

  return KakaoTokenResponseSchema.parse(await response.json());
}
