const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(\+?\d[\d\-\s().]{7,}\d)/g;
const SECRET_KEYS = /(api[_-]?key|secret|token|authorization|password)/i;

export function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message)
    };
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    const entries: readonly (readonly [string, unknown])[] = Object.entries(value);
    return Object.fromEntries(
      entries.map(([key, nestedValue]) => [
        key,
        SECRET_KEYS.test(key) ? "[REDACTED]" : redactValue(nestedValue)
      ])
    );
  }
  return value;
}

export function redactString(value: string): string {
  return value.replace(EMAIL_PATTERN, maskEmail).replace(PHONE_PATTERN, "[REDACTED_PHONE]");
}

export function safeLogPayload(payload: unknown): string {
  return JSON.stringify(redactValue(payload));
}

function maskEmail(email: string): string {
  const separatorIndex = email.indexOf("@");
  const name = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);
  return `${name.slice(0, 1)}***@${domain}`;
}
