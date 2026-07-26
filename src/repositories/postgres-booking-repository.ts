import { z } from "zod";
import type { BookingRecord } from "../booking/reservation-service.js";
import type { BookingRepository } from "./interfaces.js";
import {
  PostgresInvariantError,
  type SqlClient
} from "./postgres-types.js";

const CountRowSchema = z.object({
  count: z.coerce.number().int().nonnegative()
});
const DateColumnSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.date()
]).transform((value) => {
  if (typeof value === "string") return value;
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});
const BookingRowSchema = z.object({
  id: z.string().min(1),
  customer_id: z.string().uuid(),
  destination: z.string().min(1),
  start_date: DateColumnSchema,
  end_date: DateColumnSchema.nullable(),
  travelers: z.number().int().positive(),
  product_name: z.string().min(1),
  status: z.enum(["lead", "quoted", "confirmed", "cancelled"]),
  memo_redacted: z.string().nullable()
});

export class PostgresBookingRepository implements BookingRepository {
  constructor(private readonly client: SqlClient) {}

  async createLead(record: BookingRecord): Promise<BookingRecord> {
    const result = await this.client.query(
      `INSERT INTO booking_leads (id, customer_id, destination, start_date, end_date, travelers, product_name, status, memo_redacted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.customerId,
        record.destination,
        record.startDate,
        record.endDate ?? null,
        record.travelers,
        record.productName,
        record.status,
        record.memo
      ]
    );
    if (result.rowCount === 1) return record;
    if (result.rowCount === 0) {
      const existingResult = await this.client.query(
        `SELECT id, customer_id, destination, start_date, end_date, travelers, product_name, status, memo_redacted
         FROM booking_leads
         WHERE id = $1`,
        [record.id]
      );
      const existingRow = existingResult.rows[0];
      if (!existingRow) {
        throw new PostgresInvariantError("Booking conflict returned no existing lead");
      }
      const existing = BookingRowSchema.parse(existingRow);
      return {
        id: existing.id,
        customerId: existing.customer_id,
        destination: existing.destination,
        startDate: existing.start_date,
        travelers: existing.travelers,
        productName: existing.product_name,
        status: existing.status,
        ...(existing.end_date ? { endDate: existing.end_date } : {}),
        ...(existing.memo_redacted ? { memo: existing.memo_redacted } : {})
      };
    }
    throw new PostgresInvariantError("Booking insert returned an invalid row count");
  }

  async count(): Promise<number> {
    const result = await this.client.query(
      `SELECT COUNT(*) AS count FROM booking_leads`
    );
    const row = result.rows[0];
    if (!row) throw new PostgresInvariantError("Booking count returned no row");
    return CountRowSchema.parse(row).count;
  }
}
