ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS public_token TEXT;

UPDATE proposals
SET public_token = lower(replace(gen_random_uuid()::text, '-', ''))
WHERE public_token IS NULL OR btrim(public_token) = '';

ALTER TABLE proposals
ALTER COLUMN public_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS proposals_public_token_idx
ON proposals (public_token);
