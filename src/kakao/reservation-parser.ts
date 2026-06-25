import { z } from "zod";

import { ReservationIntentSchema, type ReservationIntent } from "../shared/schemas.js";

const DATE_PATTERN = /(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/;
const TRAVELERS_PATTERN = /(\d+)\s*(명|인|people|pax)/i;
const UNKNOWN_DESTINATION = "미분류";
const DESTINATION_RULES = [
  { canonical: "양저우", aliases: ["양저우", "양저우투어", "yangzhou", "扬州", "揚州"] },
  { canonical: "제주", aliases: ["제주"] },
  { canonical: "오사카", aliases: ["오사카", "osaka"] },
  { canonical: "도쿄", aliases: ["도쿄", "tokyo"] },
  { canonical: "방콕", aliases: ["방콕", "bangkok"] },
  { canonical: "다낭", aliases: ["다낭", "danang", "da nang"] },
  { canonical: "파리", aliases: ["파리", "paris"] },
  { canonical: "로마", aliases: ["로마", "rome"] },
  { canonical: "괌", aliases: ["괌", "guam"] },
  { canonical: "하와이", aliases: ["하와이", "hawaii"] }
] as const;

const KakaoMessageProfileSchema = z.object({
  nickname: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export const KakaoMessageSchema = z.object({
  userId: z.string().min(1),
  text: z.string().min(1),
  receivedAt: z.string().datetime(),
  profile: KakaoMessageProfileSchema.optional()
});

export type KakaoMessage = Readonly<z.infer<typeof KakaoMessageSchema>>;

export function parseKakaoReservation(message: KakaoMessage): ReservationIntent {
  const parsedMessage = KakaoMessageSchema.parse(message);
  const text = parsedMessage.text.trim();
  const dateMatch = text.match(DATE_PATTERN);
  const travelersMatch = text.match(TRAVELERS_PATTERN);
  const startDate = normalizeStartDate(dateMatch, parsedMessage.receivedAt);
  const destination = inferDestination(text);
  const productName = inferProductName(text, destination);
  const customerName = parsedMessage.profile?.nickname ?? `kakao:${parsedMessage.userId}`;
  const hasConfidentIntent = dateMatch !== null && destination !== UNKNOWN_DESTINATION;

  return ReservationIntentSchema.parse({
    channel: "kakao",
    channelCustomerId: parsedMessage.userId,
    customerName,
    ...(parsedMessage.profile?.phone ? { phone: parsedMessage.profile.phone } : {}),
    ...(parsedMessage.profile?.email ? { email: parsedMessage.profile.email } : {}),
    destination,
    startDate,
    travelers: travelersMatch?.[1] ? Number(travelersMatch[1]) : 1,
    ...(productName ? { productName } : {}),
    memo: text,
    confidence: hasConfidentIntent ? inferConfidence(destination) : 0.45
  });
}

function normalizeStartDate(dateMatch: RegExpMatchArray | null, receivedAt: string): string {
  if (dateMatch === null) {
    return new Date(receivedAt).toISOString().slice(0, 10);
  }

  const year = dateMatch[1];
  const month = dateMatch[2];
  const day = dateMatch[3];

  if (year === undefined || month === undefined || day === undefined) {
    return new Date(receivedAt).toISOString().slice(0, 10);
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function inferDestination(text: string): string {
  const normalizedText = text.toLocaleLowerCase();
  const destinationRule = DESTINATION_RULES.find((rule) =>
    rule.aliases.some((alias) => normalizedText.includes(alias.toLocaleLowerCase()))
  );

  return destinationRule?.canonical ?? UNKNOWN_DESTINATION;
}

function inferProductName(text: string, destination: string): string | undefined {
  if (destination === UNKNOWN_DESTINATION) {
    return undefined;
  }

  return /투어|tour/i.test(text) ? `${destination} 투어` : undefined;
}

function inferConfidence(destination: string): number {
  return destination === "양저우" ? 0.86 : 0.82;
}
