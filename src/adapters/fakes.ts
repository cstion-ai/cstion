import { BookingRecord } from "../booking/reservation-service.js";
import { ClassifiedError, ErrorClassification } from "../platform/retry.js";
import { CrmCustomer } from "../shared/schemas.js";
import { AdapterContext, CrmAdapter, SheetsAdapter } from "./interfaces.js";

export class FakeCrmAdapter implements CrmAdapter {
  readonly syncedCustomers: CrmCustomer[] = [];

  async syncCustomer(customer: CrmCustomer): Promise<void> {
    this.syncedCustomers.push(customer);
  }
}

export class FakeSheetsAdapter implements SheetsAdapter {
  readonly appendedLeads: BookingRecord[] = [];
  readonly contexts: AdapterContext[] = [];
  attempts = 0;

  constructor(private failuresBeforeSuccess = 0, private readonly classification: ErrorClassification = "transient") {}

  async appendBookingLead(booking: BookingRecord, context: AdapterContext): Promise<void> {
    this.attempts += 1;
    this.contexts.push(context);
    if (this.failuresBeforeSuccess > 0) {
      this.failuresBeforeSuccess -= 1;
      throw new ClassifiedError("Fake Sheets failure", this.classification);
    }
    this.appendedLeads.push(booking);
  }
}
