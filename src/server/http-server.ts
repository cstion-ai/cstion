import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { FakeCrmAdapter, FakeSheetsAdapter } from "../adapters/fakes.js";
import { buildKakaoLoginUrl, exchangeKakaoAuthorizationCode } from "../kakao/oauth.js";
import { KakaoMessage } from "../kakao/reservation-parser.js";
import { createKakaoPipeline } from "../pipelines/kakao-to-crm.js";
import { safeLogPayload } from "../platform/redaction.js";
import { FakeBookingRepository, FakeCustomerRepository, FakePostgresIdempotencyRepository } from "../repositories/fakes.js";
import { loadConfig } from "../shared/config.js";

const pipeline = createKakaoPipeline({
  idempotencyRepository: new FakePostgresIdempotencyRepository(),
  customerRepository: new FakeCustomerRepository(),
  bookingRepository: new FakeBookingRepository(),
  crmAdapter: new FakeCrmAdapter(),
  sheetsAdapter: new FakeSheetsAdapter()
});

export type JsonResponse = Record<string, unknown> | Array<unknown>;

export async function handleKakaoWebhook(message: KakaoMessage) {
  return pipeline(message);
}

export function createAppServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { ok: true, service: "travel-ai-automation" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/auth/kakao/login") {
        const config = loadConfig();
        if (!config.kakaoRestApiKey || !config.kakaoRedirectUri) {
          sendJson(response, 500, { error: "Kakao OAuth config is missing" });
          return;
        }

        sendJson(response, 200, {
          redirectUrl: buildKakaoLoginUrl(
            { clientId: config.kakaoRestApiKey, redirectUri: config.kakaoRedirectUri, clientSecret: config.kakaoClientSecret },
            randomUUID()
          )
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/auth/kakao/callback") {
        const code = url.searchParams.get("code");
        const config = loadConfig();
        if (!code || !config.kakaoRestApiKey || !config.kakaoRedirectUri) {
          sendJson(response, 400, { error: "Kakao authorization code or config is missing" });
          return;
        }

        const token = await exchangeKakaoAuthorizationCode(
          { clientId: config.kakaoRestApiKey, redirectUri: config.kakaoRedirectUri, clientSecret: config.kakaoClientSecret },
          code
        );
        sendJson(response, 200, { connected: true, tokenType: token.token_type, expiresIn: token.expires_in });
        return;
      }

      if (request.method === "POST" && url.pathname === "/webhooks/kakao") {
        const payload = await readJson<KakaoMessage>(request);
        const result = await handleKakaoWebhook(payload);
        sendJson(response, result.status === "created" ? 201 : 202, result);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      console.error(safeLogPayload({ event: "request_failed", path: url.pathname, error }));
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Unknown server error" });
    }
  });
}

export async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export function sendJson(response: ServerResponse, statusCode: number, payload: JsonResponse) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
