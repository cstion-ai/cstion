import assert from "node:assert/strict";
import test from "node:test";
import {
  initReservationSandbox,
  type SandboxNavigator
} from "../src/web/reservation-sandbox-entry.js";
import {
  createFakeSandboxDocument,
  FAKE_SANDBOX_CONSTRUCTORS
} from "./support/fake-browser-dom.js";

type ClipboardCompletion = {
  readonly resolve: () => void;
  readonly reject: (reason: Error) => void;
};

class DeferredClipboard {
  private readonly completions: ClipboardCompletion[] = [];

  writeText(_value: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.completions.push({ resolve, reject });
    });
  }

  succeed(): void {
    this.takeCompletion().resolve();
  }

  fail(): void {
    this.takeCompletion().reject(new Error("clipboard blocked"));
  }

  private takeCompletion(): ClipboardCompletion {
    const completion = this.completions.shift();
    if (completion === undefined) throw new Error("No clipboard write is pending");
    return completion;
  }
}

test("Given the browser sandbox, when input changes and is parsed, then stale results cannot be copied", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboardWrites: string[] = [];
  const browserNavigator: SandboxNavigator = {
    clipboard: {
      writeText: async (value: string) => { clipboardWrites.push(value); }
    }
  };

  initReservationSandbox(
    fixture.document,
    browserNavigator,
    FAKE_SANDBOX_CONSTRUCTORS
  );

  assert.equal(fixture.elements["sandbox-route"].textContent, "Required fields complete");
  assert.equal(fixture.elements["sandbox-copy"].disabled, false);

  fixture.elements["sandbox-message"].value = "다낭 자유여행 2명 문의";
  fixture.elements["sandbox-message"].dispatchEvent(new Event("input"));

  assert.equal(fixture.elements["sandbox-route"].textContent, "Not parsed");
  assert.equal(fixture.elements["sandbox-copy"].disabled, true);
  assert.equal(fixture.elements["sandbox-json"].textContent, "{}");

  fixture.elements["reservation-sandbox-form"].dispatchEvent(
    new Event("submit", { cancelable: true })
  );
  assert.equal(fixture.elements["sandbox-route"].textContent, "Needs confirmation");
  assert.equal(fixture.elements["sandbox-copy"].disabled, false);

  fixture.elements["sandbox-copy"].click();
  await Promise.resolve();
  assert.equal(clipboardWrites.length, 1);
  assert.doesNotMatch(clipboardWrites[0] ?? "", /다낭 자유여행/);

  fixture.elements["sandbox-download"].click();
  assert.equal(fixture.document.anchors.length, 1);
  assert.equal(fixture.document.anchors[0]?.clickCount, 1);
  assert.equal(
    fixture.document.anchors[0]?.download,
    "cstion-synthetic-reservation-result.json"
  );
});

test("Given invalid synthetic input, when it is submitted, then result actions stay disabled", () => {
  const fixture = createFakeSandboxDocument();

  initReservationSandbox(fixture.document, {}, FAKE_SANDBOX_CONSTRUCTORS);
  fixture.elements["sandbox-message"].value = "   ";
  fixture.elements["reservation-sandbox-form"].dispatchEvent(
    new Event("submit", { cancelable: true })
  );

  assert.equal(fixture.elements["sandbox-route"].textContent, "Input needed");
  assert.equal(fixture.elements["sandbox-copy"].disabled, true);
  assert.equal(fixture.elements["sandbox-download"].disabled, true);
});

test("Given another checked-in example, when it is selected, then parsing uses the loaded text", () => {
  const fixture = createFakeSandboxDocument();

  initReservationSandbox(fixture.document, {}, FAKE_SANDBOX_CONSTRUCTORS);
  fixture.elements["sandbox-example"].value = "invalid-date";
  fixture.elements["sandbox-example"].dispatchEvent(new Event("change"));

  assert.match(fixture.elements["sandbox-message"].value, /2월 31일/);
  assert.equal(fixture.elements["sandbox-copy"].disabled, true);
  fixture.elements["reservation-sandbox-form"].dispatchEvent(
    new Event("submit", { cancelable: true })
  );
  assert.equal(fixture.elements["sandbox-route"].textContent, "Needs confirmation");
});

test("Given a pending copy, when the message changes before success, then the newer status remains", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboard = new DeferredClipboard();
  initReservationSandbox(fixture.document, { clipboard }, FAKE_SANDBOX_CONSTRUCTORS);

  fixture.elements["sandbox-copy"].click();
  fixture.elements["sandbox-message"].value = "다낭 자유여행 2명 문의";
  fixture.elements["sandbox-message"].dispatchEvent(new Event("input"));
  clipboard.succeed();
  await Promise.resolve();

  assert.equal(
    fixture.elements["sandbox-status"].textContent,
    "Message changed. Select Parse locally."
  );
});

test("Given a pending copy, when an example loads before failure, then the newer status remains", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboard = new DeferredClipboard();
  initReservationSandbox(fixture.document, { clipboard }, FAKE_SANDBOX_CONSTRUCTORS);

  fixture.elements["sandbox-copy"].click();
  fixture.elements["sandbox-example"].value = "missing-date";
  fixture.elements["sandbox-example"].dispatchEvent(new Event("change"));
  clipboard.fail();
  await Promise.resolve();

  assert.equal(
    fixture.elements["sandbox-status"].textContent,
    "Synthetic example loaded. Select Parse locally."
  );
});

test("Given a pending copy, when the form is resubmitted before success, then the parsed status remains", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboard = new DeferredClipboard();
  initReservationSandbox(fixture.document, { clipboard }, FAKE_SANDBOX_CONSTRUCTORS);

  fixture.elements["sandbox-copy"].click();
  fixture.elements["reservation-sandbox-form"].dispatchEvent(
    new Event("submit", { cancelable: true })
  );
  clipboard.succeed();
  await Promise.resolve();

  assert.equal(
    fixture.elements["sandbox-status"].textContent,
    "Parsed locally. All required fields were found."
  );
});

test("Given a pending copy, when a download finishes first, then copy success cannot replace its status", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboard = new DeferredClipboard();
  initReservationSandbox(fixture.document, { clipboard }, FAKE_SANDBOX_CONSTRUCTORS);

  fixture.elements["sandbox-copy"].click();
  fixture.elements["sandbox-download"].click();
  clipboard.succeed();
  await Promise.resolve();

  assert.equal(
    fixture.elements["sandbox-status"].textContent,
    "Safe result JSON downloaded."
  );
});

test("Given two pending copies, when the older one fails first, then only the latest copy updates status", async () => {
  const fixture = createFakeSandboxDocument();
  const clipboard = new DeferredClipboard();
  initReservationSandbox(fixture.document, { clipboard }, FAKE_SANDBOX_CONSTRUCTORS);

  fixture.elements["sandbox-copy"].click();
  fixture.elements["sandbox-copy"].click();
  clipboard.fail();
  await Promise.resolve();

  assert.equal(
    fixture.elements["sandbox-status"].textContent,
    "Parsed locally. All required fields were found."
  );

  clipboard.succeed();
  await Promise.resolve();
  assert.equal(fixture.elements["sandbox-status"].textContent, "Safe result JSON copied.");
});
