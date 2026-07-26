import test from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import {
  buildKakaoLoginUrl,
  exchangeKakaoAuthorizationCode,
  KakaoOAuthExchangeError
} from "../src/kakao/oauth.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

test("parseKakaoReservation extracts complete reservation draft", () => {
  const reservation = parseKakaoReservation({
    providerEventId: "event-1",
    providerUserId: "user-1",
    text: "김여행입니다. 2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요.",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { nickname: "김여행", phone: "+82-10-1111-2222" }
  });

  assert.equal(reservation.providerEventId, "event-1");
  assert.equal(reservation.providerUserId, "user-1");
  assert.equal(reservation.customerName, "김여행");
  assert.equal(reservation.destination, "오사카");
  assert.equal(reservation.startDate, "2026-09-03");
  assert.equal(reservation.travelers, 2);
  assert.equal(reservation.productName, "패키지");
  assert.equal(reservation.confidence, 0.86);
});

test("Given the login boundary, when an authorization URL is built, then it does not request unused personal scopes", () => {
  const url = new URL(
    buildKakaoLoginUrl(
      { clientId: "rest-key", redirectUri: "https://travel.example.com/auth/kakao/callback" },
      "state-token"
    )
  );

  assert.equal(url.origin, "https://kauth.kakao.com");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "rest-key");
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "https://travel.example.com/auth/kakao/callback"
  );
  assert.equal(url.searchParams.get("state"), "state-token");
  assert.equal(url.searchParams.get("scope"), null);
});

test("exchangeKakaoAuthorizationCode returns a typed error for provider failures", async (context) => {
  const server = await startTokenServer(503);
  context.after(() => closeServer(server));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  await assert.rejects(
    exchangeKakaoAuthorizationCode(
      {
        clientId: "rest-key",
        redirectUri: "https://travel.example.com/auth/kakao/callback",
        tokenUrl: `http://127.0.0.1:${address.port}/token`
      },
      "authorization-code"
    ),
    (error: unknown) => {
      assert.ok(error instanceof KakaoOAuthExchangeError);
      assert.equal(error.reason, "provider_response");
      assert.equal(error.statusCode, 503);
      return true;
    }
  );
});

test("exchangeKakaoAuthorizationCode returns a typed error for network failures", async () => {
  await assert.rejects(
    exchangeKakaoAuthorizationCode(
      {
        clientId: "rest-key",
        redirectUri: "https://travel.example.com/auth/kakao/callback",
        tokenUrl: "http://127.0.0.1:1/token"
      },
      "authorization-code"
    ),
    (error: unknown) => {
      assert.ok(error instanceof KakaoOAuthExchangeError);
      assert.equal(error.reason, "network");
      assert.equal(error.statusCode, undefined);
      return true;
    }
  );
});

test("exchangeKakaoAuthorizationCode returns a typed error for invalid success payloads", async (context) => {
  const server = await startTokenServer(200);
  context.after(() => closeServer(server));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  await assert.rejects(
    exchangeKakaoAuthorizationCode(
      {
        clientId: "rest-key",
        redirectUri: "https://travel.example.com/auth/kakao/callback",
        tokenUrl: `http://127.0.0.1:${address.port}/token`
      },
      "authorization-code"
    ),
    (error: unknown) => {
      assert.ok(error instanceof KakaoOAuthExchangeError);
      assert.equal(error.reason, "invalid_response");
      return true;
    }
  );
});

async function startTokenServer(statusCode: number): Promise<Server> {
  const { createServer } = await import("node:http");
  const server = createServer((_request, response) => {
    response.writeHead(statusCode);
    response.end("{}");
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return server;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
