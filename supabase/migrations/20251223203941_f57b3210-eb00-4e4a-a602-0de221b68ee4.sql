UPDATE company_documents 
SET mime_type = 'application/pdf' 
WHERE document_type = 'Loan' 
  AND mime_type IS NULL 
  AND (file_url LIKE '%.pdf' OR name LIKE '%.pdf');