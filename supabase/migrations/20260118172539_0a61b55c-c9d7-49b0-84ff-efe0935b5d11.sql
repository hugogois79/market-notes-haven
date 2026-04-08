-- Create ENUM types for staff management
CREATE TYPE staff_role_category AS ENUM ('Aviation', 'Maritime', 'Ground', 'Office', 'Household');
CREATE TYPE staff_status AS ENUM ('Active', 'Leave', 'Terminated', 'Mission');
CREATE TYPE staff_doc_type AS ENUM ('NDA', 'Employment_Contract', 'Passport', 'License', 'Medical_Cert', 'Other');
CREATE TYPE vacation_type AS ENUM ('Paid', 'Sick', 'Unpaid');
CREATE TYPE vacation_approval_status AS ENUM ('Pending', 'Approved', 'Denied');

-- Create staff_profiles table
CREATE TABLE public.staff_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_category staff_role_category NOT NULL DEFAULT 'Office',
  specific_title TEXT,
  status staff_status NOT NULL DEFAULT 'Active',
  contact_info JSONB DEFAULT '{}',
  base_salary NUMERIC(12, 2),
  hire_date DATE,
  avatar_url TEXT,
  notes TEXT,
  annual_vacation_days INTEGER DEFAULT 22,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contracts_docs table
CREATE TABLE public.contracts_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type staff_doc_type NOT NULL DEFAULT 'Other',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vacation_logs table
CREATE TABLE public.vacation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  vacation_type vacation_type NOT NULL DEFAULT 'Paid',
  approval_status vacation_approval_status NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX idx_staff_profiles_user_id ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_role_category ON public.staff_profiles(role_category);
CREATE INDEX idx_staff_profiles_status ON public.staff_profiles(status);
CREATE INDEX idx_contracts_docs_staff_id ON public.contracts_docs(staff_id);
CREATE INDEX idx_contracts_docs_user_id ON public.contracts_docs(user_id);
CREATE INDEX idx_contracts_docs_expiry_date ON public.contracts_docs(expiry_date);
CREATE INDEX idx_vacation_logs_staff_id ON public.vacation_logs(staff_id);
CREATE INDEX idx_vacation_logs_user_id ON public.vacation_logs(user_id);
CREATE INDEX idx_vacation_logs_dates ON public.vacation_logs(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_profiles
CREATE POLICY "Users can view their own staff profiles"
  ON public.staff_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staff profiles"
  ON public.staff_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff profiles"
  ON public.staff_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own staff profiles"
  ON public.staff_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for contracts_docs
CREATE POLICY "Users can view their own contract documents"
  ON public.contracts_docs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contract documents"
  ON public.contracts_docs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract documents"
  ON public.contracts_docs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contract documents"
  ON public.contracts_docs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vacation_logs
CREATE POLICY "Users can view their own vacation logs"
  ON public.vacation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vacation logs"
  ON public.vacation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vacation logs"
  ON public.vacation_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vacation logs"
  ON public.vacation_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_contracts_docs_updated_at
  BEFORE UPDATE ON public.contracts_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_vacation_logs_updated_at
  BEFORE UPDATE ON public.vacation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_operations_updated_at();

-- Create private storage bucket for staff documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('staff-vault', 'staff-vault', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff-vault bucket
CREATE POLICY "Users can view their own staff vault files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to their own staff vault"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'staff-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own staff vault files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'staff-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own staff vault files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'staff-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to get expiring documents within N days
CREATE OR REPLACE FUNCTION public.get_expiring_documents(p_user_id UUID, days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  doc_id UUID,
  staff_id UUID,
  staff_name TEXT,
  doc_type staff_doc_type,
  file_name TEXT,
  expiry_date DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id as doc_id,
    cd.staff_id,
    sp.full_name as staff_name,
    cd.doc_type,
    cd.file_name,
    cd.expiry_date,
    (cd.expiry_date - CURRENT_DATE)::INTEGER as days_remaining
  FROM public.contracts_docs cd
  JOIN public.staff_profiles sp ON cd.staff_id = sp.id
  WHERE cd.user_id = p_user_id
    AND cd.expiry_date IS NOT NULL
    AND cd.expiry_date <= CURRENT_DATE + days_threshold
    AND cd.expiry_date >= CURRENT_DATE
  ORDER BY cd.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate vacation balance for a staff member
CREATE OR REPLACE FUNCTION public.calculate_vacation_balance(p_staff_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_annual_days INTEGER;
  v_used_days INTEGER;
  v_pending_days INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get annual vacation days from staff profile
  SELECT annual_vacation_days INTO v_annual_days
  FROM public.staff_profiles
  WHERE id = p_staff_id;
  
  IF v_annual_days IS NULL THEN
    v_annual_days := 22; -- Default
  END IF;
  
  -- Calculate used vacation days (approved, current year)
  SELECT COALESCE(SUM(end_date - start_date + 1), 0) INTO v_used_days
  FROM public.vacation_logs
  WHERE staff_id = p_staff_id
    AND approval_status = 'Approved'
    AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Calculate pending vacation days (current year)
  SELECT COALESCE(SUM(end_date - start_date + 1), 0) INTO v_pending_days
  FROM public.vacation_logs
  WHERE staff_id = p_staff_id
    AND approval_status = 'Pending'
    AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_remaining := v_annual_days - v_used_days;
  
  RETURN jsonb_build_object(
    'total_days', v_annual_days,
    'used_days', v_used_days,
    'pending_days', v_pending_days,
    'remaining_days', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check vacation conflicts (same role category overlapping)
CREATE OR REPLACE FUNCTION public.check_vacation_conflicts(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_role_category staff_role_category,
  p_exclude_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  overlap_start DATE,
  overlap_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as staff_id,
    sp.full_name as staff_name,
    GREATEST(vl.start_date, p_start_date) as overlap_start,
    LEAST(vl.end_date, p_end_date) as overlap_end
  FROM public.vacation_logs vl
  JOIN public.staff_profiles sp ON vl.staff_id = sp.id
  WHERE sp.user_id = p_user_id
    AND sp.role_category = p_role_category
    AND vl.approval_status IN ('Approved', 'Pending')
    AND vl.start_date <= p_end_date
    AND vl.end_date >= p_start_date
    AND (p_exclude_staff_id IS NULL OR sp.id != p_exclude_staff_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;