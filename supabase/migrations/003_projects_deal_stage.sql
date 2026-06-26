-- Atlas Personal — estágio comercial dos projetos de cliente
-- Rodar no Supabase SQL Editor: https://supabase.com/dashboard/project/fctwkxrixyzlyihsxsaj/sql/new
--
-- prospect  = sites em desenvolvimento para tentar vender (prospecção)
-- client    = projetos de clientes que já fecharam (contratado)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS deal_stage TEXT NOT NULL DEFAULT 'client';
