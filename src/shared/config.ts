import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  CRM_BASE_URL: z.string().url().default("http://localhost:3000"),
  CRM_API_KEY: z.string().optional(),
  KAKAO_REST_API_KEY: z.string().optional(),
  KAKAO_REDIRECT_URI: z.string().url().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  KAKAO_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional()
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  for (const key of ["CRM_API_KEY", "KAKAO_REST_API_KEY", "KAKAO_REDIRECT_URI", "KAKAO_CLIENT_SECRET", "KAKAO_WEBHOOK_SECRET", "GOOGLE_SHEET_ID", "POSTGRES_PASSWORD"] as const) {
    if (!env[key]) context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required in production` });
  }
});

export type PlatformConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  kakaoRestApiKey?: string;
  kakaoRedirectUri?: string;
  kakaoClientSecret?: string;
  kakaoWebhookSecret?: string;
  crmBaseUrl: string;
  crmApiKey?: string;
  googleSheetId?: string;
  postgresPassword?: string;
};

export function loadConfig(env = process.env): PlatformConfig {
  const parsed = EnvSchema.parse(env);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    kakaoRestApiKey: parsed.KAKAO_REST_API_KEY,
    kakaoRedirectUri: parsed.KAKAO_REDIRECT_URI,
    kakaoClientSecret: parsed.KAKAO_CLIENT_SECRET,
    kakaoWebhookSecret: parsed.KAKAO_WEBHOOK_SECRET,
    crmBaseUrl: parsed.CRM_BASE_URL,
    crmApiKey: parsed.CRM_API_KEY,
    googleSheetId: parsed.GOOGLE_SHEET_ID,
    postgresPassword: parsed.POSTGRES_PASSWORD
  };
}
