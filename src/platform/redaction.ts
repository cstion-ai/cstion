const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(\+?\d[\d\-\s().]{7,}\d)/g;
const SECRET_KEYS = /(api[_-]?key|secret|token|authorization|password)/i;

export function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
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
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}
