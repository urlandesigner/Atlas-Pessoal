-- ============================================================
-- Atlas — Indexes de Performance
-- ============================================================

-- Records: queries mais frequentes
CREATE INDEX idx_records_user_date        ON records (user_id, date DESC);
CREATE INDEX idx_records_user_workspace   ON records (user_id, workspace);
CREATE INDEX idx_records_user_category    ON records (user_id, category);
CREATE INDEX idx_records_user_status      ON records (user_id, status);
CREATE INDEX idx_records_project          ON records (project_id);
CREATE INDEX idx_records_tags             ON records USING GIN (tags);

-- Projects
CREATE INDEX idx_projects_user_workspace  ON projects (user_id, workspace);
CREATE INDEX idx_projects_user_status     ON projects (user_id, status);
CREATE INDEX idx_projects_client          ON projects (client_id);

-- Clients
CREATE INDEX idx_clients_user             ON clients (user_id);

-- Contracts
CREATE INDEX idx_contracts_user_status    ON contracts (user_id, status);
CREATE INDEX idx_contracts_client         ON contracts (client_id);
CREATE INDEX idx_contracts_renewal        ON contracts (renewal_at) WHERE renewal_at IS NOT NULL;

-- Attachments
CREATE INDEX idx_attachments_record       ON attachments (record_id);

-- AI Summaries
CREATE INDEX idx_ai_summaries_user_period ON ai_summaries (user_id, period_type, period_start DESC);
