-- Create enum for project status
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- Create enum for document types
CREATE TYPE document_type AS ENUM ('quotation', 'receipt', 'contract', 'invoice', 'proposal', 'report');

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  client_name TEXT,
  client_contact TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type document_type NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#fbbf24',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bulletin_posts table for company updates
CREATE TABLE public.bulletin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_branding table
CREATE TABLE public.company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#f59e0b',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (all authenticated users can view and manage)
CREATE POLICY "Anyone authenticated can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for documents
CREATE POLICY "Anyone authenticated can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for notes
CREATE POLICY "Anyone authenticated can view notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can create notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bulletin_posts
CREATE POLICY "Anyone authenticated can view bulletin posts"
  ON public.bulletin_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can create bulletin posts"
  ON public.bulletin_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update bulletin posts"
  ON public.bulletin_posts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete bulletin posts"
  ON public.bulletin_posts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for company_branding
CREATE POLICY "Anyone authenticated can view branding"
  ON public.company_branding FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can update branding"
  ON public.company_branding FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can insert branding"
  ON public.company_branding FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulletin_posts_updated_at
  BEFORE UPDATE ON public.bulletin_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON public.company_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company branding
INSERT INTO public.company_branding (
  company_name,
  primary_color,
  secondary_color,
  address,
  phone,
  email
) VALUES (
  'Engineering Solutions Ltd.',
  '#1e40af',
  '#f59e0b',
  '123 Engineering Drive, Tech City',
  '+1 (555) 123-4567',
  'info@engineering-solutions.com'
);