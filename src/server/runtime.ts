import { FakeCrmAdapter, FakeSheetsAdapter } from "../adapters/fakes.js";
import { createInMemoryDemoPipeline, createKakaoPipeline, type PipelineResult } from "../pipelines/kakao-to-crm.js";
import { PostgresDatabase } from "../repositories/postgres-database.js";
import {
  PostgresBookingRepository,
  PostgresCustomerRepository,
  PostgresIdempotencyRepository
} from "../repositories/postgres-repositories.js";
import type { PlatformConfig } from "../shared/config.js";
import type { KakaoMessage } from "../kakao/reservation-parser.js";

export type AppRuntime = {
  readonly handleKakaoWebhook: (message: KakaoMessage) => Promise<PipelineResult>;
  readonly close: () => Promise<void>;
};

export function createAppRuntime(config: PlatformConfig): AppRuntime {
  if (!config.databaseUrl) {
    if (config.nodeEnv === "production") {
      throw new RuntimeConfigurationError("DATABASE_URL is required for production persistence");
    }
    return {
      handleKakaoWebhook: createInMemoryDemoPipeline(),
      close: async () => {}
    };
  }

  if (config.nodeEnv === "production") {
    throw new RuntimeConfigurationError(
      "Production CRM and Sheets adapters are not implemented"
    );
  }

  const database = new PostgresDatabase({ connectionString: config.databaseUrl });
  return {
    handleKakaoWebhook: createKakaoPipeline({
      idempotencyRepository: new PostgresIdempotencyRepository(database),
      customerRepository: new PostgresCustomerRepository(database),
      bookingRepository: new PostgresBookingRepository(database),
      crmAdapter: new FakeCrmAdapter(),
      sheetsAdapter: new FakeSheetsAdapter()
    }),
    close: () => database.close()
  };
}

class RuntimeConfigurationError extends Error {
  readonly name = "RuntimeConfigurationError";
}
