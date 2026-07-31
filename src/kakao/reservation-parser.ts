import type { z } from "zod";
import {
  ChannelMessageSchema,
  ReservationDraftSchema,
  type ChannelMessage,
  type ReservationDraft
} from "../shared/schemas.js";

const DATE_PATTERN = /(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/;
const TRAVELERS_PATTERN = /(?:^|[^\d.])(-?\d+)(?![.\d])\s*(명|인|people|pax)/i;
const PRODUCT_PATTERN = /(패키지|항공권|호텔|투어|렌터카|신혼여행|자유여행|골프여행)/;

export const KakaoMessageSchema = ChannelMessageSchema.omit({ channel: true });

export type KakaoMessage = z.infer<typeof KakaoMessageSchema>;

export function toKakaoChannelMessage(message: KakaoMessage): ChannelMessage {
  return ChannelMessageSchema.parse({ channel: "kakao", ...message });
}

export function parseKakaoReservation(message: KakaoMessage | ChannelMessage): ReservationDraft {
  const channelMessage = "channel" in message ? ChannelMessageSchema.parse(message) : toKakaoChannelMessage(message);
  const text = channelMessage.text.trim();
  const startDate = extractStartDate(text);
  const travelers = extractTravelers(text);
  const productName = PRODUCT_PATTERN.exec(text)?.at(1);
  const issues: string[] = [];

  if (!startDate) issues.push("startDate");
  if (travelers === undefined) issues.push("travelers");
  if (!productName) issues.push("productName");

  const destination = inferDestination(text);
  if (!destination) issues.push("destination");

  return ReservationDraftSchema.parse({
    channel: "kakao",
    providerEventId: channelMessage.providerEventId,
    providerUserId: channelMessage.providerUserId,
    customerName: channelMessage.profile?.nickname ?? `kakao:${channelMessage.providerUserId}`,
    phone: channelMessage.profile?.phone,
    email: channelMessage.profile?.email,
    destination,
    startDate,
    travelers,
    productName,
    memo: text,
    confidence: startDate && destination && travelers !== undefined && productName ? 0.86 : 0.42,
    issues
  });
}

function extractStartDate(text: string): string | undefined {
  const match = DATE_PATTERN.exec(text);
  const year = match?.at(1);
  const month = match?.at(2);
  const day = match?.at(3);
  if (!year || !month || !day) return undefined;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extractTravelers(text: string): number | undefined {
  const textValue = TRAVELERS_PATTERN.exec(text)?.at(1);
  if (textValue === undefined) return undefined;
  const value = Number(textValue);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function inferDestination(text: string): string | undefined {
  const destinations = ["제주", "오사카", "도쿄", "방콕", "다낭", "파리", "로마", "괌", "하와이"];
  return destinations.find((destination) => text.includes(destination));
}
