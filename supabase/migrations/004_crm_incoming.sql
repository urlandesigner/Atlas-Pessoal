-- ============================================================
-- CRM Incoming Leads
-- Recebe leads via webhook (ex: Google Sheets → Apps Script)
-- Processados pelo cliente e importados para o localStorage
-- ============================================================

CREATE TABLE crm_incoming_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  company          TEXT,
  segment          TEXT,
  city             TEXT,
  state            TEXT,
  current_site     TEXT,
  instagram        TEXT,
  project_type     TEXT,
  project_objective TEXT,
  desired_deadline TEXT,
  investment_range TEXT,
  origin           TEXT,
  estimated_value  NUMERIC,
  responsible      TEXT,
  processed        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca eficiente de não-processados
CREATE INDEX idx_crm_incoming_unprocessed
  ON crm_incoming_leads (processed, created_at)
  WHERE processed = FALSE;
