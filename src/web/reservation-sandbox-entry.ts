import {
  SandboxInputError,
  evaluateSyntheticReservation,
  type SandboxResult
} from "./reservation-sandbox.js";

const SYNTHETIC_EXAMPLES = {
  complete: "2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요.",
  "missing-date": "다낭 자유여행 2명 문의",
  "invalid-date": "2026년 2월 31일 제주 호텔 3명 예약"
} as const;

export type SandboxElement = Pick<EventTarget, "addEventListener"> & {
  textContent: string | null;
  readonly dataset: DOMStringMap;
};

export type SandboxFormElement = SandboxElement;
export type SandboxSelectElement = SandboxElement & { value: string };
export type SandboxTextAreaElement = SandboxElement & { value: string };
export type SandboxButtonElement = SandboxElement & { disabled: boolean };
export type SandboxAnchorElement = {
  href: string;
  download: string;
  click(): void;
};

export type SandboxDocument = {
  getElementById(id: string): unknown;
  createElement(tagName: "a"): SandboxAnchorElement;
};

export type SandboxNavigator = {
  readonly clipboard?: {
    writeText(value: string): Promise<void>;
  };
};

type ElementConstructor<T extends SandboxElement> = {
  readonly prototype: T;
  new(): T;
};

export type SandboxElementConstructors = {
  readonly element: ElementConstructor<SandboxElement>;
  readonly form: ElementConstructor<SandboxFormElement>;
  readonly select: ElementConstructor<SandboxSelectElement>;
  readonly textarea: ElementConstructor<SandboxTextAreaElement>;
  readonly button: ElementConstructor<SandboxButtonElement>;
};

type SandboxView = {
  readonly form: SandboxFormElement;
  readonly example: SandboxSelectElement;
  readonly message: SandboxTextAreaElement;
  readonly status: SandboxElement;
  readonly destination: SandboxElement;
  readonly startDate: SandboxElement;
  readonly travelers: SandboxElement;
  readonly productName: SandboxElement;
  readonly route: SandboxElement;
  readonly routeDetail: SandboxElement;
  readonly json: SandboxElement;
  readonly copy: SandboxButtonElement;
  readonly download: SandboxButtonElement;
  readonly result: SandboxElement;
};

class SandboxConfigurationError extends Error {
  override readonly name = "SandboxConfigurationError";

  constructor(id: string) {
    super(`Missing browser sandbox element: ${id}`);
  }
}

export function initReservationSandbox(
  root: SandboxDocument,
  browserNavigator: SandboxNavigator,
  constructors: SandboxElementConstructors = getBrowserElementConstructors()
): void {
  const view: SandboxView = {
    form: getRequiredElement(root, "reservation-sandbox-form", constructors.form),
    example: getRequiredElement(root, "sandbox-example", constructors.select),
    message: getRequiredElement(root, "sandbox-message", constructors.textarea),
    status: getRequiredElement(root, "sandbox-status", constructors.element),
    destination: getRequiredElement(root, "sandbox-destination", constructors.element),
    startDate: getRequiredElement(root, "sandbox-start-date", constructors.element),
    travelers: getRequiredElement(root, "sandbox-travelers", constructors.element),
    productName: getRequiredElement(root, "sandbox-product", constructors.element),
    route: getRequiredElement(root, "sandbox-route", constructors.element),
    routeDetail: getRequiredElement(root, "sandbox-route-detail", constructors.element),
    json: getRequiredElement(root, "sandbox-json", constructors.element),
    copy: getRequiredElement(root, "sandbox-copy", constructors.button),
    download: getRequiredElement(root, "sandbox-download", constructors.button),
    result: getRequiredElement(root, "sandbox-result", constructors.element)
  };
  let currentJson: string | undefined;

  const parseCurrentMessage = (): void => {
    try {
      const result = evaluateSyntheticReservation(view.message.value);
      currentJson = JSON.stringify(result, null, 2);
      renderResult(view, result, currentJson);
    } catch (error) {
      if (error instanceof SandboxInputError) {
        currentJson = undefined;
        renderInputError(view, error.message);
        return;
      }
      throw error;
    }
  };

  view.example.addEventListener("change", () => {
    view.message.value = getSyntheticExample(view.example.value);
    currentJson = undefined;
    renderPending(view, "Synthetic example loaded. Select Parse locally.");
  });

  view.message.addEventListener("input", () => {
    currentJson = undefined;
    renderPending(view, "Message changed. Select Parse locally.");
  });

  view.form.addEventListener("submit", (event) => {
    event.preventDefault();
    parseCurrentMessage();
  });

  view.copy.addEventListener("click", () => {
    if (currentJson === undefined) return;
    const clipboard = browserNavigator.clipboard;
    if (clipboard === undefined) {
      view.status.textContent = "Clipboard access is unavailable. Open the JSON result and copy it manually.";
      return;
    }
    void clipboard.writeText(currentJson).then(
      () => { view.status.textContent = "Safe result JSON copied."; },
      () => { view.status.textContent = "Copy was blocked. Open the JSON result and copy it manually."; }
    );
  });

  view.download.addEventListener("click", () => {
    if (currentJson === undefined) return;
    const url = URL.createObjectURL(new Blob([currentJson], { type: "application/json" }));
    const link = root.createElement("a");
    link.href = url;
    link.download = "cstion-synthetic-reservation-result.json";
    link.click();
    URL.revokeObjectURL(url);
    view.status.textContent = "Safe result JSON downloaded.";
  });

  parseCurrentMessage();
}

function renderResult(
  view: SandboxView,
  result: SandboxResult,
  serialized: string
): void {
  view.destination.textContent = formatValue(result.destination);
  view.startDate.textContent = formatValue(result.startDate);
  view.travelers.textContent = formatValue(result.travelers);
  view.productName.textContent = formatValue(result.productName);
  switch (result.route) {
    case "created":
      view.route.textContent = "Required fields complete";
      view.routeDetail.textContent = "The deterministic parser found all four required booking fields.";
      view.status.textContent = "Parsed locally. All required fields were found.";
      break;
    case "needs_confirmation":
      view.route.textContent = "Needs confirmation";
      view.routeDetail.textContent = `Review before booking: ${result.missingFields.join(", ")}.`;
      view.status.textContent = "Parsed locally. Human confirmation is required.";
      break;
    default: {
      const unsupportedRoute: never = result.route;
      throw new SandboxConfigurationError(`unsupported route: ${String(unsupportedRoute)}`);
    }
  }
  view.json.textContent = serialized;
  view.copy.disabled = false;
  view.download.disabled = false;
  view.result.dataset["route"] = result.route;
}

function renderInputError(view: SandboxView, message: string): void {
  view.destination.textContent = "—";
  view.startDate.textContent = "—";
  view.travelers.textContent = "—";
  view.productName.textContent = "—";
  view.route.textContent = "Input needed";
  view.routeDetail.textContent = message;
  view.json.textContent = "{}";
  view.copy.disabled = true;
  view.download.disabled = true;
  view.result.dataset["route"] = "invalid";
  view.status.textContent = message;
}

function renderPending(view: SandboxView, message: string): void {
  view.destination.textContent = "—";
  view.startDate.textContent = "—";
  view.travelers.textContent = "—";
  view.productName.textContent = "—";
  view.route.textContent = "Not parsed";
  view.routeDetail.textContent = "Select Parse locally to evaluate the current synthetic message.";
  view.json.textContent = "{}";
  view.copy.disabled = true;
  view.download.disabled = true;
  view.result.dataset["route"] = "pending";
  view.status.textContent = message;
}

function formatValue(value: string | number | null): string {
  return value === null ? "Not found" : String(value);
}

function getSyntheticExample(id: string): string {
  switch (id) {
    case "complete": return SYNTHETIC_EXAMPLES.complete;
    case "missing-date": return SYNTHETIC_EXAMPLES["missing-date"];
    case "invalid-date": return SYNTHETIC_EXAMPLES["invalid-date"];
    default: throw new SandboxConfigurationError("sandbox-example option");
  }
}

function getRequiredElement<T extends SandboxElement>(
  root: SandboxDocument,
  id: string,
  constructor: ElementConstructor<T>
): T {
  const element = root.getElementById(id);
  if (!(element instanceof constructor)) throw new SandboxConfigurationError(id);
  return element;
}

function getBrowserElementConstructors(): SandboxElementConstructors {
  return {
    element: HTMLElement,
    form: HTMLFormElement,
    select: HTMLSelectElement,
    textarea: HTMLTextAreaElement,
    button: HTMLButtonElement
  };
}

if (typeof document !== "undefined" && typeof navigator !== "undefined") {
  initReservationSandbox(document, navigator);
}
