-- Atlas Pessoal — 1º ano gratuito de domínio/hospedagem na proposta
-- Rodar no Supabase SQL Editor se ainda não aplicou as migrations locais.

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS domain_first_year_free BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS hosting_first_year_free BOOLEAN NOT NULL DEFAULT FALSE;

-- Atualiza o cache de schema da API (PostgREST) após novas colunas
NOTIFY pgrst, 'reload schema';
