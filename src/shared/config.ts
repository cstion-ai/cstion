export type PlatformConfig = {
  readonly kakaoRestApiKey?: string;
  readonly kakaoWebhookSecret?: string;
  readonly crmBaseUrl: string;
  readonly crmApiKey?: string;
  readonly googleSheetId?: string;
};

export function loadConfig(env = process.env): PlatformConfig {
  return {
    crmBaseUrl: env["CRM_BASE_URL"] ?? "http://localhost:3000",
    ...(env["KAKAO_REST_API_KEY"] ? { kakaoRestApiKey: env["KAKAO_REST_API_KEY"] } : {}),
    ...(env["KAKAO_WEBHOOK_SECRET"] ? { kakaoWebhookSecret: env["KAKAO_WEBHOOK_SECRET"] } : {}),
    ...(env["CRM_API_KEY"] ? { crmApiKey: env["CRM_API_KEY"] } : {}),
    ...(env["GOOGLE_SHEET_ID"] ? { googleSheetId: env["GOOGLE_SHEET_ID"] } : {})
  };
}
