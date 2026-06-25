import { z } from "zod";

import { DEFAULT_TOUR_PRODUCTS, findTourProduct, type TourProduct } from "../catalog/tour-catalog.js";
import { ReservationIntentSchema, type ReservationIntent } from "../shared/schemas.js";

const DATE_PATTERN = /(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/;
const TRAVELERS_PATTERN = /(\d+)\s*(명|인|people|pax)/i;
const UNKNOWN_DESTINATION = "미분류";

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

export function parseKakaoReservation(
  message: KakaoMessage,
  products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS
): ReservationIntent {
  const parsedMessage = KakaoMessageSchema.parse(message);
  const text = parsedMessage.text.trim();
  const dateMatch = text.match(DATE_PATTERN);
  const travelersMatch = text.match(TRAVELERS_PATTERN);
  const startDate = normalizeStartDate(dateMatch, parsedMessage.receivedAt);
  const product = findTourProduct(text, products);
  const destination = product?.destination ?? UNKNOWN_DESTINATION;
  const customerName = parsedMessage.profile?.nickname ?? `kakao:${parsedMessage.userId}`;

  return ReservationIntentSchema.parse({
    channel: "kakao",
    channelCustomerId: parsedMessage.userId,
    customerName,
    ...(parsedMessage.profile?.phone ? { phone: parsedMessage.profile.phone } : {}),
    ...(parsedMessage.profile?.email ? { email: parsedMessage.profile.email } : {}),
    destination,
    startDate,
    travelers: travelersMatch?.[1] ? Number(travelersMatch[1]) : 1,
    ...(product ? { productId: product.productId, productName: product.productName } : {}),
    memo: text,
    confidence: inferConfidence(product, dateMatch !== null)
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

function inferConfidence(product: TourProduct | undefined, hasDate: boolean): number {
  if (product && hasDate) {
    return 0.86;
  }

  return product ? 0.68 : 0.45;
}
