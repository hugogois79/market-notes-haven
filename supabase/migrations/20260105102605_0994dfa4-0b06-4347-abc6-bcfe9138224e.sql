-- Restore original file URL for Autoridade Tributária document
UPDATE workflow_files
SET file_url = 'https://zyziolikudoczsthyoja.supabase.co/storage/v1/object/public/attachments/31377412-f0d4-4fdf-bf6b-7ca78d6caedf/1767608012974-Ethnicproposal_Unipessoal_Lda_27-08-2025_4218_43_Autoridade_Tributaria_E_Aduaneira_PENDENT.pdf',
    updated_at = now()
WHERE id = 'd54ff538-bb5a-4247-a420-3de03191b03b';