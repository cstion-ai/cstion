CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS channel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  error_classification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (channel, provider_event_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  identity_type TEXT NOT NULL,
  provider TEXT,
  identity_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (identity_type, provider, identity_value)
);

CREATE TABLE IF NOT EXISTS booking_leads (
  id TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  travelers INTEGER NOT NULL CHECK (travelers > 0),
  product_name TEXT NOT NULL,
  status TEXT NOT NULL,
  memo_redacted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
