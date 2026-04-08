-- Add company_id to real_estate_properties
ALTER TABLE real_estate_properties 
ADD COLUMN company_id UUID REFERENCES companies(id);

-- Add property_id to company_documents
ALTER TABLE company_documents 
ADD COLUMN property_id UUID REFERENCES real_estate_properties(id);

-- Add property_id to company_folders
ALTER TABLE company_folders 
ADD COLUMN property_id UUID REFERENCES real_estate_properties(id);

-- Create indexes for performance
CREATE INDEX idx_re_properties_company ON real_estate_properties(company_id);
CREATE INDEX idx_company_docs_property ON company_documents(property_id);
CREATE INDEX idx_company_folders_property ON company_folders(property_id);

-- Update RLS policy for real_estate_properties to also allow access via company
DROP POLICY IF EXISTS "Users can view their own properties" ON real_estate_properties;
CREATE POLICY "Users can view their own properties" ON real_estate_properties
FOR SELECT USING (
  user_id = auth.uid() 
  OR company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create their own properties" ON real_estate_properties;
CREATE POLICY "Users can create their own properties" ON real_estate_properties
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own properties" ON real_estate_properties;
CREATE POLICY "Users can update their own properties" ON real_estate_properties
FOR UPDATE USING (
  user_id = auth.uid()
  OR company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own properties" ON real_estate_properties;
CREATE POLICY "Users can delete their own properties" ON real_estate_properties
FOR DELETE USING (
  user_id = auth.uid()
  OR company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
    UNION
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);