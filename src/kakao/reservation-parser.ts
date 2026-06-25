import { ReservationIntent, ReservationIntentSchema } from "../shared/schemas.js";

const DATE_PATTERN = /(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/;
const TRAVELERS_PATTERN = /(\d+)\s*(명|인|people|pax)/i;

export type KakaoMessage = {
  userId: string;
  text: string;
  receivedAt: string;
  profile?: { nickname?: string; phone?: string; email?: string };
};

export function parseKakaoReservation(message: KakaoMessage): ReservationIntent {
  const text = message.text.trim();
  const dateMatch = text.match(DATE_PATTERN);
  const travelersMatch = text.match(TRAVELERS_PATTERN);

  const startDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
    : new Date(message.receivedAt).toISOString().slice(0, 10);

  const destination = inferDestination(text);
  const customerName = message.profile?.nickname ?? `kakao:${message.userId}`;

  return ReservationIntentSchema.parse({
    channel: "kakao",
    customerName,
    phone: message.profile?.phone,
    email: message.profile?.email,
    destination,
    startDate,
    travelers: travelersMatch ? Number(travelersMatch[1]) : 1,
    memo: text,
    confidence: dateMatch && destination !== "미분류" ? 0.82 : 0.45
  });
}

function inferDestination(text: string): string {
  const destinations = ["제주", "오사카", "도쿄", "방콕", "다낭", "파리", "로마", "괌", "하와이"];
  return destinations.find((destination) => text.includes(destination)) ?? "미분류";
}
