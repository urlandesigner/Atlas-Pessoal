-- Atlas Personal — RLS para app single-user com login
-- Rodar no Supabase SQL Editor: https://supabase.com/dashboard/project/fctwkxrixyzlyihsxsaj/sql/new
--
-- Mantém RLS ativo (sem avisos do painel) e libera acesso total
-- apenas para usuários autenticados. Como é single-user, não há
-- necessidade de ownership por linha.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','proposals','clients','projects'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_authenticated_access', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      t || '_authenticated_access', t
    );
  END LOOP;
END $$;
