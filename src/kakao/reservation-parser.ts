import type { z } from "zod";
import {
  ChannelMessageSchema,
  ReservationDraftSchema,
  type ChannelMessage,
  type ReservationDraft
} from "../shared/schemas.js";

const DATE_PATTERN = /(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/;
const TRAVELERS_PATTERN = /(\d+)\s*(명|인|people|pax)/i;
const PRODUCT_PATTERN = /(패키지|항공권|호텔|투어|렌터카|신혼여행|자유여행|골프여행)/;

export const KakaoMessageSchema = ChannelMessageSchema.omit({ channel: true });

export type KakaoMessage = z.infer<typeof KakaoMessageSchema>;

export function toKakaoChannelMessage(message: KakaoMessage): ChannelMessage {
  return ChannelMessageSchema.parse({ channel: "kakao", ...message });
}

export function parseKakaoReservation(message: KakaoMessage | ChannelMessage): ReservationDraft {
  const channelMessage = "channel" in message ? ChannelMessageSchema.parse(message) : toKakaoChannelMessage(message);
  const text = channelMessage.text.trim();
  const dateMatch = text.match(DATE_PATTERN);
  const travelersMatch = text.match(TRAVELERS_PATTERN);
  const productMatch = text.match(PRODUCT_PATTERN);
  const issues: string[] = [];

  const startDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
    : undefined;
  if (!startDate) issues.push("startDate");
  if (!travelersMatch) issues.push("travelers");
  if (!productMatch) issues.push("productName");

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
    travelers: travelersMatch ? Number(travelersMatch[1]) : undefined,
    productName: productMatch?.[1],
    memo: text,
    confidence: startDate && destination && travelersMatch && productMatch ? 0.86 : 0.42,
    issues
  });
}

function inferDestination(text: string): string | undefined {
  const destinations = ["제주", "오사카", "도쿄", "방콕", "다낭", "파리", "로마", "괌", "하와이"];
  return destinations.find((destination) => text.includes(destination));
}
