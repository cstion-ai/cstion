import { z } from "zod";

export const DatabaseUrlSchema = z.string().url().refine(
  (value) => /^postgres(?:ql)?:\/\//i.test(value),
  { message: "DATABASE_URL must use a PostgreSQL URL" }
);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().max(65_535).default(8080),
  CRM_BASE_URL: z.string().url().default("http://localhost:3000"),
  CRM_API_KEY: z.string().optional(),
  KAKAO_REST_API_KEY: z.string().optional(),
  KAKAO_REDIRECT_URI: z.string().url().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  KAKAO_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  DATABASE_URL: DatabaseUrlSchema.optional()
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  const requiredKeys: readonly ProductionRequiredKey[] = [
    "CRM_API_KEY",
    "KAKAO_REST_API_KEY",
    "KAKAO_REDIRECT_URI",
    "KAKAO_CLIENT_SECRET",
    "KAKAO_WEBHOOK_SECRET",
    "GOOGLE_SHEET_ID",
    "DATABASE_URL"
  ];
  for (const key of requiredKeys) {
    if (!env[key]) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: `${key} is required in production`
      });
    }
  }
  for (const externalUrl of [
    { key: "CRM_BASE_URL", value: env.CRM_BASE_URL },
    { key: "KAKAO_REDIRECT_URI", value: env.KAKAO_REDIRECT_URI }
  ]) {
    if (externalUrl.value && new URL(externalUrl.value).protocol !== "https:") {
      context.addIssue({
        code: "custom",
        path: [externalUrl.key],
        message: `${externalUrl.key} must use HTTPS in production`
      });
    }
  }
});

type ProductionRequiredKey =
  | "CRM_API_KEY"
  | "KAKAO_REST_API_KEY"
  | "KAKAO_REDIRECT_URI"
  | "KAKAO_CLIENT_SECRET"
  | "KAKAO_WEBHOOK_SECRET"
  | "GOOGLE_SHEET_ID"
  | "DATABASE_URL";

export type PlatformConfig = {
  readonly nodeEnv: "development" | "test" | "production";
  readonly host: string;
  readonly port: number;
  readonly kakaoRestApiKey: string | undefined;
  readonly kakaoRedirectUri: string | undefined;
  readonly kakaoClientSecret: string | undefined;
  readonly kakaoWebhookSecret: string | undefined;
  readonly crmBaseUrl: string;
  readonly crmApiKey: string | undefined;
  readonly googleSheetId: string | undefined;
  readonly databaseUrl: string | undefined;
};

export function loadConfig(env = process.env): PlatformConfig {
  const parsed = EnvSchema.parse(env);
  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.HOST ?? (parsed.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
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
