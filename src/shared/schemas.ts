import { z } from "zod";

export const ChannelSchema = z.enum(["kakao", "wechat", "google-sheet", "booking"]);

export const ReservationIntentSchema = z.object({
  channel: ChannelSchema,
  customerName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  destination: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  travelers: z.number().int().positive().default(1),
  productName: z.string().optional(),
  memo: z.string().optional(),
  confidence: z.number().min(0).max(1)
});

export type ReservationIntent = z.infer<typeof ReservationIntentSchema>;

export const CrmCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  sourceChannel: ChannelSchema,
  tags: z.array(z.string()).default([])
});

export type CrmCustomer = z.infer<typeof CrmCustomerSchema>;
