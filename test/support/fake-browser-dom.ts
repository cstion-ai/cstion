import type {
  SandboxDocument,
  SandboxElementConstructors
} from "../../src/web/reservation-sandbox-entry.js";

export class FakeHTMLElement extends EventTarget {
  textContent = "";
  readonly dataset: Record<string, string> = {};
  clickCount = 0;

  click(): void {
    this.clickCount += 1;
    this.dispatchEvent(new Event("click"));
  }
}

export class FakeHTMLFormElement extends FakeHTMLElement {}

export class FakeHTMLSelectElement extends FakeHTMLElement {
  value = "complete";
}

export class FakeHTMLTextAreaElement extends FakeHTMLElement {
  value = "2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요.";
}

export class FakeHTMLButtonElement extends FakeHTMLElement {
  disabled = true;
}

export class FakeHTMLAnchorElement extends FakeHTMLElement {
  href = "";
  download = "";
}

export type FakeSandboxElements = ReturnType<typeof createFakeSandboxElements>;

export class FakeDocument implements SandboxDocument {
  readonly anchors: FakeHTMLAnchorElement[] = [];

  constructor(private readonly elements: Map<string, FakeHTMLElement>) {}

  getElementById(id: string): FakeHTMLElement | null {
    return this.elements.get(id) ?? null;
  }

  createElement(tagName: "a"): FakeHTMLAnchorElement {
    if (tagName !== "a") throw new Error(`Unexpected element: ${tagName}`);
    const anchor = new FakeHTMLAnchorElement();
    this.anchors.push(anchor);
    return anchor;
  }
}

export const FAKE_SANDBOX_CONSTRUCTORS: SandboxElementConstructors = {
  element: FakeHTMLElement,
  form: FakeHTMLFormElement,
  select: FakeHTMLSelectElement,
  textarea: FakeHTMLTextAreaElement,
  button: FakeHTMLButtonElement
};

export function createFakeSandboxDocument(): {
  readonly document: FakeDocument;
  readonly elements: FakeSandboxElements;
} {
  const elements = createFakeSandboxElements();
  const entries = Object.entries(elements).map(([id, element]) => [id, element] as const);
  return { document: new FakeDocument(new Map(entries)), elements };
}

function createFakeSandboxElements() {
  return {
    "reservation-sandbox-form": new FakeHTMLFormElement(),
    "sandbox-example": new FakeHTMLSelectElement(),
    "sandbox-message": new FakeHTMLTextAreaElement(),
    "sandbox-status": new FakeHTMLElement(),
    "sandbox-destination": new FakeHTMLElement(),
    "sandbox-start-date": new FakeHTMLElement(),
    "sandbox-travelers": new FakeHTMLElement(),
    "sandbox-product": new FakeHTMLElement(),
    "sandbox-route": new FakeHTMLElement(),
    "sandbox-route-detail": new FakeHTMLElement(),
    "sandbox-json": new FakeHTMLElement(),
    "sandbox-copy": new FakeHTMLButtonElement(),
    "sandbox-download": new FakeHTMLButtonElement(),
    "sandbox-result": new FakeHTMLElement()
  };
}
