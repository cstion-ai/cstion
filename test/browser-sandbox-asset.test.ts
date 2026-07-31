import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { gzipSync } from "node:zlib";

const PROJECT_ROOT = new URL("..", import.meta.url);

test("Given the public page, when an evaluator visits it, then the local synthetic sandbox is accessible", async () => {
  const html = await readFile(new URL("index.html", PROJECT_ROOT), "utf8");
  const sandboxCss = await readFile(
    new URL("styles/sandbox.css", PROJECT_ROOT),
    "utf8"
  );

  assert.match(html, /id="reservation-sandbox-form"/);
  assert.match(html, /for="sandbox-message"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Processing stays in this browser/);
  assert.match(html, /styles\/sandbox\.css/);
  assert.match(html, /docs\/assets\/reservation-sandbox\.js/);
  assert.match(sandboxCss, /\.sandbox-form textarea[\s\S]*word-break: keep-all/);
});

test("Given the published release, when the evidence strip renders, then every destination identifies the verified v0.1.3 evidence", async () => {
  const html = await readFile(new URL("index.html", PROJECT_ROOT), "utf8");
  const stripStart = html.indexOf('<section class="evidence-strip"');
  const stripEnd = html.indexOf("</section>", stripStart);
  assert.ok(stripStart >= 0 && stripEnd > stripStart);
  const evidenceStrip = html.slice(stripStart, stripEnd);

  assert.match(evidenceStrip, /releases\/tag\/v0\.1\.3/);
  assert.match(evidenceStrip, /<strong>v0\.1\.3 published<\/strong>/);
  assert.match(evidenceStrip, /actions\/runs\/30668586589"/);
  assert.match(evidenceStrip, /actions\/runs\/30668586589\/job\/91281208082/);
  assert.match(evidenceStrip, /actions\/runs\/30668586661/);
  assert.doesNotMatch(evidenceStrip, /prepared|v0\.1\.2|30623841372/);
});

test("Given the checked-in browser bundle, when it is inspected, then it stays small and contains no network client", async () => {
  const bundle = await readFile(
    new URL("docs/assets/reservation-sandbox.js", PROJECT_ROOT)
  );
  const source = bundle.toString("utf8");

  assert.ok(gzipSync(bundle).byteLength < 75_000);
  assert.doesNotMatch(
    source,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/
  );
});
