-- Nova oferta: desconto sobre proposta já enviada (mesmo link público)

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS baseline_total_value NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS offer_revision INTEGER NOT NULL DEFAULT 0;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS offer_updated_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
