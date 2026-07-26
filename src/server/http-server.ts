import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { z } from "zod";
import { buildKakaoLoginUrl, exchangeKakaoAuthorizationCode } from "../kakao/oauth.js";
import { KakaoMessageSchema, type KakaoMessage } from "../kakao/reservation-parser.js";
import type { PipelineResult } from "../pipelines/kakao-to-crm.js";
import { safeLogPayload } from "../platform/redaction.js";
import type { PlatformConfig } from "../shared/config.js";
import {
  clearConnectCookie,
  createConnectCheck,
  createConnectCookie,
  hasValidConnectCheck
} from "./oauth-state.js";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const SIGNATURE_PREFIX = "sha256=";
const PIPELINE_STATUS_CODE = {
  duplicate: 202,
  needs_confirmation: 202,
  created: 201
} satisfies Readonly<Record<PipelineResult["status"], number>>;

export type JsonResponse = Record<string, unknown> | readonly unknown[];

export type AppServerDependencies = {
  readonly config: PlatformConfig;
  readonly handleKakaoWebhook: (message: KakaoMessage) => Promise<PipelineResult>;
  readonly exchangeKakaoCode?: typeof exchangeKakaoAuthorizationCode;
};

export function createAppServer(dependencies: AppServerDependencies) {
  const exchangeKakaoCode = dependencies.exchangeKakaoCode ?? exchangeKakaoAuthorizationCode;

  return createServer(async (request, response) => {
    let requestPath = "[invalid request target]";

    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      requestPath = url.pathname;
      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { ok: true, service: "travel-ai-automation" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/auth/kakao/login") {
        response.setHeader("Cache-Control", "no-store");
        const config = dependencies.config;
        if (!config.kakaoRestApiKey || !config.kakaoRedirectUri || !config.kakaoWebhookSecret) {
          sendJson(response, 500, { error: "Kakao OAuth config is missing" });
          return;
        }

        const state = randomUUID();
        response.setHeader(
          "Set-Cookie",
          createConnectCookie(
            createConnectCheck(state, config.kakaoWebhookSecret),
            config.nodeEnv === "production"
          )
        );
        sendJson(response, 200, {
          redirectUrl: buildKakaoLoginUrl(
            {
              clientId: config.kakaoRestApiKey,
              redirectUri: config.kakaoRedirectUri,
              ...(config.kakaoClientSecret ? { clientSecret: config.kakaoClientSecret } : {})
            },
            state
          )
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/auth/kakao/callback") {
        response.setHeader("Cache-Control", "no-store");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const config = dependencies.config;
        response.setHeader(
          "Set-Cookie",
          clearConnectCookie(config.nodeEnv === "production")
        );
        if (
          !code
          || !config.kakaoRestApiKey
          || !config.kakaoRedirectUri
          || !config.kakaoWebhookSecret
          || !hasValidConnectCheck(state, request.headers.cookie, config.kakaoWebhookSecret)
        ) {
          sendJson(response, 400, { error: "Invalid Kakao OAuth callback" });
          return;
        }

        const token = await exchangeKakaoCode(
          {
            clientId: config.kakaoRestApiKey,
            redirectUri: config.kakaoRedirectUri,
            ...(config.kakaoClientSecret ? { clientSecret: config.kakaoClientSecret } : {})
          },
          code
        );
        sendJson(response, 200, {
          connected: true,
          tokenType: token.token_type,
          expiresIn: token.expires_in
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/webhooks/kakao") {
        const body = await readBody(request);
        if (!isValidWebhookSignature(request, body, dependencies.config)) {
          sendJson(response, 401, { error: "Invalid webhook signature" });
          return;
        }

        const json: unknown = JSON.parse(body.toString("utf8"));
        const payload = KakaoMessageSchema.parse(json);
        const result = await dependencies.handleKakaoWebhook(payload);
        sendJson(response, PIPELINE_STATUS_CODE[result.status], result);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        sendJson(response, 413, { error: "Request body too large" });
        return;
      }
      if (
        error instanceof TypeError
        && "code" in error
        && error.code === "ERR_INVALID_URL"
      ) {
        sendJson(response, 400, { error: "Invalid request target" });
        return;
      }
      if (error instanceof SyntaxError || error instanceof z.ZodError) {
        sendJson(response, 400, { error: "Invalid request payload" });
        return;
      }

      console.error(safeLogPayload({ event: "request_failed", path: requestPath, error }));
      sendJson(response, 500, { error: "Internal server error" });
    }
  });
}

export async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_WEBHOOK_BODY_BYTES) {
      throw new RequestBodyTooLargeError(MAX_WEBHOOK_BODY_BYTES);
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

export function sendJson(response: ServerResponse, statusCode: number, payload: JsonResponse): void {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isValidWebhookSignature(
  request: IncomingMessage,
  body: Buffer,
  config: PlatformConfig
): boolean {
  const secret = config.kakaoWebhookSecret;
  if (!secret) return config.nodeEnv === "development";
  const header = request.headers["x-kakao-signature"];
  if (!header || Array.isArray(header)) return false;
  const signature = header.startsWith(SIGNATURE_PREFIX) ? header.slice(SIGNATURE_PREFIX.length) : header;
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;

  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "hex");
  return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
}

class RequestBodyTooLargeError extends Error {
  readonly name = "RequestBodyTooLargeError";

  constructor(readonly maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
  }
}
