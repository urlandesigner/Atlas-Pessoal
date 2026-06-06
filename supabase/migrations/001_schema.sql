-- ============================================================
-- Atlas — Schema Principal
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- Espelha auth.users com dados extras do perfil
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger: cria profile automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CLIENTS
-- Clientes do workspace freelancer
-- ============================================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- PROJECTS
-- Projetos profissionais e freelancer
-- ============================================================
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  workspace   TEXT NOT NULL CHECK (workspace IN ('professional', 'freelancer')),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'support', 'paused', 'closed', 'inactive')),
  stack       TEXT[] DEFAULT '{}',
  value       NUMERIC(12, 2),
  links       JSONB DEFAULT '[]',
  started_at  DATE,
  ended_at    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- CONTRACTS
-- Contratos e valores freelancer
-- ============================================================
CREATE TABLE contracts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  value       NUMERIC(12, 2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'BRL',
  type        TEXT NOT NULL CHECK (type IN ('fixed', 'monthly', 'hourly')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'pending', 'closed')),
  started_at  DATE NOT NULL,
  ended_at    DATE,
  renewal_at  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- RECORDS
-- Entidade central: registros de atuação profissional
-- ============================================================
CREATE TABLE records (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id           UUID REFERENCES projects(id) ON DELETE SET NULL,
  workspace            TEXT NOT NULL CHECK (workspace IN ('professional', 'freelancer')),

  -- Identificação
  title                TEXT NOT NULL,
  description          TEXT,
  category             TEXT NOT NULL
                       CHECK (category IN (
                         'demand', 'improvement', 'decision', 'implementation',
                         'meeting', 'alignment', 'mentoring', 'automation',
                         'workshop', 'support'
                       )),
  status               TEXT NOT NULL DEFAULT 'published'
                       CHECK (status IN ('draft', 'published', 'archived')),
  priority             TEXT NOT NULL DEFAULT 'medium'
                       CHECK (priority IN ('low', 'medium', 'high')),
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Contexto
  problem              TEXT,
  objective            TEXT,
  expected_impact      TEXT,

  -- Atuação
  contribution         TEXT,
  leadership           TEXT,
  decisions            TEXT,
  solution             TEXT,

  -- Resultado
  impact_generated     TEXT,
  perceived_improvement TEXT,
  feedback             TEXT,
  learnings            TEXT,

  -- Metadados
  tags                 TEXT[] DEFAULT '{}',
  ai_summary           TEXT,
  raw_input            TEXT,  -- texto livre original enviado para a IA

  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ATTACHMENTS
-- Evidências vinculadas a registros
-- ============================================================
CREATE TABLE attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('image', 'file', 'link', 'figma', 'github', 'video')),
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- AI_SUMMARIES
-- Resumos periódicos gerados pela IA
-- ============================================================
CREATE TABLE ai_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type   TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  content       TEXT NOT NULL,
  highlights    TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
