-- Tornar o bucket 'company-documents' público (atenção: expõe todos os ficheiros do bucket via URL pública)
UPDATE storage.buckets
SET public = true
WHERE id = 'company-documents';

-- Garantir leitura pública via RLS (útil para SDK / listas). Mantém a política existente para utilizadores autenticados.
DROP POLICY IF EXISTS "Company documents are publicly accessible" ON storage.objects;
CREATE POLICY "Company documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents');