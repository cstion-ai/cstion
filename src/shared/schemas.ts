import { z } from "zod";

export const ChannelSchema = z.enum(["kakao", "wechat", "google-sheet", "booking"]);

export const ChannelMessageSchema = z.object({
  channel: ChannelSchema,
  providerEventId: z.string().min(1),
  providerUserId: z.string().min(1),
  text: z.string().min(1),
  receivedAt: z.string().datetime(),
  profile: z.object({ nickname: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional() }).optional()
});

export type ChannelMessage = z.infer<typeof ChannelMessageSchema>;

export const ReservationDraftSchema = z.object({
  channel: ChannelSchema,
  providerEventId: z.string().min(1),
  providerUserId: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().int().positive().optional(),
  productName: z.string().optional(),
  memo: z.string().optional(),
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()).default([])
});

export type ReservationDraft = z.infer<typeof ReservationDraftSchema>;

export const ReservationIntentSchema = ReservationDraftSchema.extend({
  destination: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelers: z.number().int().positive(),
  productName: z.string().min(1),
  issues: z.array(z.string()).length(0)
});

export type ReservationIntent = z.infer<typeof ReservationIntentSchema>;

export const CustomerIdentitySchema = z.object({
  type: z.enum(["channel", "phone", "email"]),
  provider: z.string().optional(),
  value: z.string().min(1)
});

export type CustomerIdentity = z.infer<typeof CustomerIdentitySchema>;

export const CrmCustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sourceChannel: ChannelSchema,
  identities: z.array(CustomerIdentitySchema),
  tags: z.array(z.string()).default([])
});

export type CrmCustomer = z.infer<typeof CrmCustomerSchema>;
