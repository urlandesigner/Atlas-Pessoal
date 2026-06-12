-- Atlas Personal — Schema inicial
-- Rodar no Supabase SQL Editor: https://supabase.com/dashboard/project/fctwkxrixyzlyihsxsaj/sql/new

-- ─── LEADS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id                    TEXT PRIMARY KEY,
  status_stage          TEXT NOT NULL DEFAULT 'lead',
  status                TEXT NOT NULL DEFAULT 'new',
  lost                  BOOLEAN NOT NULL DEFAULT FALSE,
  lost_reason           TEXT NOT NULL DEFAULT '',
  lost_at               TIMESTAMPTZ,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  company               TEXT NOT NULL DEFAULT '',
  segment               TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL DEFAULT '',
  state                 TEXT NOT NULL DEFAULT '',
  origin                TEXT NOT NULL DEFAULT '',
  client_id             TEXT,
  -- nested objects
  prospect              JSONB NOT NULL DEFAULT '{}',
  qualification         JSONB NOT NULL DEFAULT '{}',
  opportunity           JSONB NOT NULL DEFAULT '{}',
  communication         JSONB NOT NULL DEFAULT '{}',
  stage_completion      JSONB NOT NULL DEFAULT '{}',
  -- arrays
  stages                JSONB NOT NULL DEFAULT '[]',
  activities            JSONB NOT NULL DEFAULT '[]',
  comments              JSONB NOT NULL DEFAULT '[]',
  timeline              JSONB NOT NULL DEFAULT '[]',
  briefing              JSONB NOT NULL DEFAULT '{}',
  proposal_ids          JSONB NOT NULL DEFAULT '[]',
  project_ids           JSONB NOT NULL DEFAULT '[]',
  -- legacy scalar fields (backward compat)
  name                  TEXT NOT NULL DEFAULT '',
  email                 TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL DEFAULT '',
  whatsapp              TEXT NOT NULL DEFAULT '',
  instagram             TEXT NOT NULL DEFAULT '',
  project_type          TEXT NOT NULL DEFAULT '',
  project_objective     TEXT NOT NULL DEFAULT '',
  desired_deadline      TEXT NOT NULL DEFAULT '',
  investment_range      TEXT NOT NULL DEFAULT '',
  estimated_value       NUMERIC,
  responsible           TEXT NOT NULL DEFAULT '',
  proposal_id           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROPOSALS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL DEFAULT '',
  client_id          TEXT,
  client_name        TEXT NOT NULL DEFAULT '',
  project_id         TEXT,
  lead_id            TEXT,
  proposal_date      TEXT NOT NULL DEFAULT '',
  valid_until        TEXT NOT NULL DEFAULT '',
  objective          TEXT NOT NULL DEFAULT '',
  estimated_deadline TEXT NOT NULL DEFAULT '',
  total_value        NUMERIC NOT NULL DEFAULT 0,
  entry_mode         TEXT NOT NULL DEFAULT 'percent',
  entry_value        NUMERIC NOT NULL DEFAULT 0,
  payment_method     TEXT NOT NULL DEFAULT '',
  is_partnership     BOOLEAN NOT NULL DEFAULT FALSE,
  notes              TEXT,
  status             TEXT NOT NULL DEFAULT 'draft',
  -- arrays as JSONB
  scope              JSONB NOT NULL DEFAULT '[]',
  included           JSONB NOT NULL DEFAULT '[]',
  not_included       JSONB NOT NULL DEFAULT '[]',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id                     TEXT PRIMARY KEY,
  lead_id                TEXT,
  proposal_id            TEXT,
  name                   TEXT NOT NULL DEFAULT '',
  company                TEXT,
  phone                  TEXT,
  whatsapp               TEXT,
  email                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',
  project_id             TEXT,
  project_name           TEXT NOT NULL DEFAULT '',
  project_type           TEXT NOT NULL DEFAULT '',
  project_start_date     TEXT NOT NULL DEFAULT '',
  project_delivery_date  TEXT NOT NULL DEFAULT '',
  contracted_value       NUMERIC NOT NULL DEFAULT 0,
  published_site_url     TEXT NOT NULL DEFAULT '',
  plan                   TEXT NOT NULL DEFAULT 'none',
  plan_started_at        TEXT NOT NULL DEFAULT '',
  monthly_value          NUMERIC NOT NULL DEFAULT 0,
  warranty_delivery_date TEXT NOT NULL DEFAULT '',
  warranty_days          INTEGER NOT NULL DEFAULT 0,
  entry_date             TEXT NOT NULL DEFAULT '',
  -- nested/arrays
  delivery               JSONB NOT NULL DEFAULT '{}',
  checklist              JSONB NOT NULL DEFAULT '[]',
  requests               JSONB NOT NULL DEFAULT '[]',
  opportunities          JSONB NOT NULL DEFAULT '[]',
  comments               JSONB NOT NULL DEFAULT '[]',
  timeline               JSONB NOT NULL DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  workspace    TEXT NOT NULL DEFAULT 'freelancer',
  name         TEXT NOT NULL DEFAULT '',
  client_id    TEXT,
  client_name  TEXT,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active',
  value        NUMERIC,
  observations TEXT,
  billing_date TEXT,
  started_at   TEXT,
  ended_at     TEXT,
  -- arrays
  stack        JSONB NOT NULL DEFAULT '[]',
  payments     JSONB NOT NULL DEFAULT '[]',
  links        JSONB NOT NULL DEFAULT '[]',
  timeline     JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ÍNDICES (performance em filtros comuns) ──────────────────────────────────

CREATE INDEX IF NOT EXISTS leads_status_stage_idx ON leads (status_stage);
CREATE INDEX IF NOT EXISTS leads_segment_idx      ON leads (segment);
CREATE INDEX IF NOT EXISTS leads_updated_at_idx   ON leads (updated_at DESC);
CREATE INDEX IF NOT EXISTS proposals_status_idx   ON proposals (status);
CREATE INDEX IF NOT EXISTS proposals_lead_id_idx  ON proposals (lead_id);
CREATE INDEX IF NOT EXISTS clients_status_idx     ON clients (status);
CREATE INDEX IF NOT EXISTS projects_workspace_idx ON projects (workspace);
