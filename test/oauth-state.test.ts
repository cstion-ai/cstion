import assert from "node:assert/strict";
import test from "node:test";
import {
  clearConnectCookie,
  createConnectCheck,
  createConnectCookie,
  hasValidConnectCheck
} from "../src/server/oauth-state.js";

const STATE = "10f8f4c2-8c7f-4b19-a29e-b347c58cf4df";
const SECRET = "test-connect-secret";

test("Given an OAuth state, when its cookie is created, then the raw state is not stored", () => {
  const check = createConnectCheck(STATE, SECRET);
  const cookie = createConnectCookie(check, false);

  assert.doesNotMatch(cookie, new RegExp(STATE));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});

test("Given a matching OAuth state, when its protected cookie is checked, then it is accepted", () => {
  const check = createConnectCheck(STATE, SECRET);
  const cookie = createConnectCookie(check, false);

  assert.equal(hasValidConnectCheck(STATE, cookie, SECRET), true);
});

test("Given a different OAuth state, when its protected cookie is checked, then it is rejected", () => {
  const check = createConnectCheck(STATE, SECRET);
  const cookie = createConnectCookie(check, false);

  assert.equal(hasValidConnectCheck("different-state", cookie, SECRET), false);
  assert.match(clearConnectCookie(false), /Max-Age=0/);
});
