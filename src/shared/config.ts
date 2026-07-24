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
  DATABASE_URL: z.string().min(1).optional()
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  const requiredKeys = [
    "CRM_API_KEY",
    "KAKAO_REST_API_KEY",
    "KAKAO_REDIRECT_URI",
    "KAKAO_CLIENT_SECRET",
    "KAKAO_WEBHOOK_SECRET",
    "GOOGLE_SHEET_ID",
    "DATABASE_URL"
  ] as const;
  for (const key of requiredKeys) {
    if (!env[key]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required in production`
      });
    }
  }
});

export type PlatformConfig = {
  readonly nodeEnv: "development" | "test" | "production";
  readonly port: number;
  readonly kakaoRestApiKey?: string;
  readonly kakaoRedirectUri?: string;
  readonly kakaoClientSecret?: string;
  readonly kakaoWebhookSecret?: string;
  readonly crmBaseUrl: string;
  readonly crmApiKey?: string;
  readonly googleSheetId?: string;
  readonly databaseUrl?: string;
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
    databaseUrl: parsed.DATABASE_URL
  };
}
