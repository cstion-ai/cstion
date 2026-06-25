export type PlatformConfig = {
  kakaoRestApiKey?: string;
  kakaoWebhookSecret?: string;
  crmBaseUrl: string;
  crmApiKey?: string;
  googleSheetId?: string;
};

export function loadConfig(env = process.env): PlatformConfig {
  return {
    kakaoRestApiKey: env.KAKAO_REST_API_KEY,
    kakaoWebhookSecret: env.KAKAO_WEBHOOK_SECRET,
    crmBaseUrl: env.CRM_BASE_URL ?? "http://localhost:3000",
    crmApiKey: env.CRM_API_KEY,
    googleSheetId: env.GOOGLE_SHEET_ID
  };
}
