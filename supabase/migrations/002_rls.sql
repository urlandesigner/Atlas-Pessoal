-- ============================================================
-- Atlas — Row Level Security
-- Usuário só acessa seus próprios dados
-- ============================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles: own data" ON profiles
  FOR ALL USING (auth.uid() = id);

-- CLIENTS
CREATE POLICY "clients: own data" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- PROJECTS
CREATE POLICY "projects: own data" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- CONTRACTS
CREATE POLICY "contracts: own data" ON contracts
  FOR ALL USING (auth.uid() = user_id);

-- RECORDS
CREATE POLICY "records: own data" ON records
  FOR ALL USING (auth.uid() = user_id);

-- ATTACHMENTS
-- Acesso via join com records (owner do record = owner do attachment)
CREATE POLICY "attachments: own records" ON attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = attachments.record_id
        AND records.user_id = auth.uid()
    )
  );

-- AI_SUMMARIES
CREATE POLICY "ai_summaries: own data" ON ai_summaries
  FOR ALL USING (auth.uid() = user_id);
