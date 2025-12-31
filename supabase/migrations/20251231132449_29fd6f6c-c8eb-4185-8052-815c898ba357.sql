-- =========================================
-- REAL ESTATE MODULE - Property Management
-- =========================================

-- Properties table (main asset table)
CREATE TABLE public.real_estate_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'residential', -- residential, commercial
  status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, vacant, sold
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Portugal',
  purchase_date DATE,
  purchase_price NUMERIC(15,2) DEFAULT 0,
  current_value NUMERIC(15,2) DEFAULT 0,
  total_maintenance_cost NUMERIC(15,2) DEFAULT 0,
  total_rents_collected NUMERIC(15,2) DEFAULT 0,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Units table (apartments, offices within a property)
CREATE TABLE public.real_estate_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.real_estate_properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_type TEXT DEFAULT 'apartment', -- apartment, office, store, garage
  area_sqm NUMERIC(10,2),
  rent_amount NUMERIC(15,2) DEFAULT 0,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE public.real_estate_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leases table (connects tenants to units)
CREATE TABLE public.real_estate_leases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.real_estate_tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.real_estate_units(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES public.real_estate_properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC(15,2) NOT NULL,
  deposit_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, terminated
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ledger table (unified income/expense)
CREATE TABLE public.real_estate_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.real_estate_properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.real_estate_tenants(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL, -- income, expense
  category TEXT NOT NULL, -- rent, tax, insurance, maintenance, utility, other
  description TEXT,
  payment_method TEXT, -- bank_transfer, cash, check, direct_debit
  status TEXT DEFAULT 'cleared', -- pending, cleared
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table with AI summary
CREATE TABLE public.real_estate_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.real_estate_properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.real_estate_tenants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- lease, invoice, legal, insurance, other
  file_url TEXT NOT NULL,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.real_estate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Users can view their own properties" ON public.real_estate_properties
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own properties" ON public.real_estate_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own properties" ON public.real_estate_properties
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own properties" ON public.real_estate_properties
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for units (via property ownership)
CREATE POLICY "Users can view units of their properties" ON public.real_estate_units
  FOR SELECT USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can create units in their properties" ON public.real_estate_units
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can update units in their properties" ON public.real_estate_units
  FOR UPDATE USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete units from their properties" ON public.real_estate_units
  FOR DELETE USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenants" ON public.real_estate_tenants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tenants" ON public.real_estate_tenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tenants" ON public.real_estate_tenants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tenants" ON public.real_estate_tenants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for leases (via property ownership)
CREATE POLICY "Users can view leases of their properties" ON public.real_estate_leases
  FOR SELECT USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can create leases for their properties" ON public.real_estate_leases
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can update leases of their properties" ON public.real_estate_leases
  FOR UPDATE USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete leases from their properties" ON public.real_estate_leases
  FOR DELETE USING (EXISTS (SELECT 1 FROM real_estate_properties WHERE id = property_id AND user_id = auth.uid()));

-- RLS Policies for ledger
CREATE POLICY "Users can view their own ledger entries" ON public.real_estate_ledger
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ledger entries" ON public.real_estate_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ledger entries" ON public.real_estate_ledger
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ledger entries" ON public.real_estate_ledger
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.real_estate_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.real_estate_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.real_estate_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.real_estate_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_properties_user_id ON public.real_estate_properties(user_id);
CREATE INDEX idx_properties_type ON public.real_estate_properties(property_type);
CREATE INDEX idx_units_property_id ON public.real_estate_units(property_id);
CREATE INDEX idx_tenants_user_id ON public.real_estate_tenants(user_id);
CREATE INDEX idx_leases_property_id ON public.real_estate_leases(property_id);
CREATE INDEX idx_leases_tenant_id ON public.real_estate_leases(tenant_id);
CREATE INDEX idx_ledger_user_id ON public.real_estate_ledger(user_id);
CREATE INDEX idx_ledger_property_id ON public.real_estate_ledger(property_id);
CREATE INDEX idx_documents_property_id ON public.real_estate_documents(property_id);

-- Trigger for updated_at
CREATE TRIGGER update_real_estate_properties_updated_at
  BEFORE UPDATE ON public.real_estate_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_units_updated_at
  BEFORE UPDATE ON public.real_estate_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_tenants_updated_at
  BEFORE UPDATE ON public.real_estate_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_leases_updated_at
  BEFORE UPDATE ON public.real_estate_leases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_ledger_updated_at
  BEFORE UPDATE ON public.real_estate_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_documents_updated_at
  BEFORE UPDATE ON public.real_estate_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();