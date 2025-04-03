-- Função para gerar UUID v4
CREATE OR REPLACE FUNCTION gerar_uuid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT uuid_generate_v4();
$$;

