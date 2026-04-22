-- Projectos de despesas: restringir a empresas (NULL ou {} = todas as empresas no Work)
ALTER TABLE public.expense_projects
ADD COLUMN IF NOT EXISTS associated_companies uuid[] NULL;

COMMENT ON COLUMN public.expense_projects.associated_companies IS
  'NULL ou array vazio = projecto disponível para todas as empresas no Work. Com UUIDs, só essas empresas veem o projecto.';

-- Incluir Evensolid em «Representacao» / «Representação» se o projecto já tiver lista restrita sem essa empresa
DO $$
DECLARE
  ev uuid;
  r RECORD;
BEGIN
  SELECT id INTO ev
  FROM public.companies
  WHERE lower(trim(name)) LIKE '%evensolid%'
     OR lower(trim(replace(name, ' ', ''))) LIKE '%evensolid%'
  ORDER BY length(trim(name)) ASC
  LIMIT 1;

  IF ev IS NULL THEN
    RAISE NOTICE 'Nenhuma empresa encontrada com nome parecido a Evensolid — ignorado.';
    RETURN;
  END IF;

  FOR r IN
    SELECT id, name, associated_companies
    FROM public.expense_projects
    WHERE trim(name) IN ('Representacao', 'Representação')
  LOOP
    IF r.associated_companies IS NULL OR cardinality(r.associated_companies) = 0 THEN
      CONTINUE;
    END IF;
    IF ev = ANY (r.associated_companies) THEN
      CONTINUE;
    END IF;
    UPDATE public.expense_projects
    SET associated_companies = r.associated_companies || ARRAY[ev]::uuid[]
    WHERE id = r.id;
  END LOOP;
END $$;
