import { z } from "zod";

export const ChannelSchema = z.enum(["kakao", "wechat", "google-sheet", "booking"]);

export const ReservationIntentSchema = z.object({
  channel: ChannelSchema,
  channelCustomerId: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  destination: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  travelers: z.number().int().positive().default(1),
  productId: z.string().optional(),
  productName: z.string().optional(),
  memo: z.string().optional(),
  confidence: z.number().min(0).max(1)
});

export type ReservationIntent = Readonly<z.infer<typeof ReservationIntentSchema>>;

export const CrmCustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  sourceChannel: ChannelSchema,
  channelCustomerId: z.string().min(1),
  tags: z.array(z.string()).default([])
});

export type CrmCustomer = Readonly<z.infer<typeof CrmCustomerSchema>>;
