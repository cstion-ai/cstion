DELETE FROM customer_identities AS duplicate
USING customer_identities AS keeper
WHERE duplicate.id > keeper.id
  AND duplicate.customer_id = keeper.customer_id
  AND duplicate.identity_type = keeper.identity_type
  AND COALESCE(duplicate.provider, '') = COALESCE(keeper.provider, '')
  AND duplicate.identity_value = keeper.identity_value;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM customer_identities
    GROUP BY identity_type, COALESCE(provider, ''), identity_value
    HAVING COUNT(DISTINCT customer_id) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot normalize customer identities owned by different customers';
  END IF;
END
$migration$;

UPDATE customer_identities
SET provider = ''
WHERE provider IS NULL;

ALTER TABLE customer_identities
  ALTER COLUMN provider SET DEFAULT '',
  ALTER COLUMN provider SET NOT NULL;

ALTER TABLE channel_events
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processing_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1;

UPDATE channel_events
SET error_classification = 'permanent'
WHERE error_classification IS NOT NULL
  AND error_classification NOT IN ('transient', 'permanent', 'rate_limited', 'timeout');

ALTER TABLE channel_events
  DROP CONSTRAINT IF EXISTS channel_events_status_check,
  DROP CONSTRAINT IF EXISTS channel_events_error_classification_check,
  DROP CONSTRAINT IF EXISTS channel_events_attempt_count_check;

ALTER TABLE channel_events
  ADD CONSTRAINT channel_events_status_check
    CHECK (status IN ('processing', 'completed', 'failed')),
  ADD CONSTRAINT channel_events_error_classification_check
    CHECK (error_classification IN ('transient', 'permanent', 'rate_limited', 'timeout')),
  ADD CONSTRAINT channel_events_attempt_count_check
    CHECK (attempt_count > 0);
