-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, table_name, operation, record_id, old_data)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, table_name, operation, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, table_name, operation, record_id, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to auto-assign employee role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_company_branding
  AFTER UPDATE ON public.company_branding
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone authenticated can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone authenticated can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone authenticated can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone authenticated can delete projects" ON public.projects;

DROP POLICY IF EXISTS "Anyone authenticated can view documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone authenticated can create documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone authenticated can update documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone authenticated can delete documents" ON public.documents;

DROP POLICY IF EXISTS "Anyone authenticated can view notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone authenticated can create notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone authenticated can update notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone authenticated can delete notes" ON public.notes;

DROP POLICY IF EXISTS "Anyone authenticated can view bulletin posts" ON public.bulletin_posts;
DROP POLICY IF EXISTS "Anyone authenticated can create bulletin posts" ON public.bulletin_posts;
DROP POLICY IF EXISTS "Anyone authenticated can update bulletin posts" ON public.bulletin_posts;
DROP POLICY IF EXISTS "Anyone authenticated can delete bulletin posts" ON public.bulletin_posts;

DROP POLICY IF EXISTS "Anyone authenticated can view branding" ON public.company_branding;
DROP POLICY IF EXISTS "Anyone authenticated can update branding" ON public.company_branding;
DROP POLICY IF EXISTS "Anyone authenticated can insert branding" ON public.company_branding;

-- New RLS policies for projects
CREATE POLICY "Users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Employees can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers and admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.is_manager_or_admin(auth.uid()) OR created_by = auth.uid()
  );

CREATE POLICY "Only admins and managers can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    public.is_manager_or_admin(auth.uid())
  );

-- New RLS policies for documents
CREATE POLICY "Users can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own documents, managers can update all"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_manager_or_admin(auth.uid())
  );

CREATE POLICY "Users can delete their own documents, admins can delete all"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- New RLS policies for notes
CREATE POLICY "Users can view notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- New RLS policies for bulletin_posts
CREATE POLICY "Users can view bulletin posts"
  ON public.bulletin_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can create bulletin posts"
  ON public.bulletin_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_manager_or_admin(auth.uid())
  );

CREATE POLICY "Managers and admins can update bulletin posts"
  ON public.bulletin_posts FOR UPDATE
  TO authenticated
  USING (
    public.is_manager_or_admin(auth.uid())
  );

CREATE POLICY "Admins can delete bulletin posts"
  ON public.bulletin_posts FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- New RLS policies for company_branding
CREATE POLICY "Users can view company branding"
  ON public.company_branding FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update company branding"
  ON public.company_branding FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admins can insert company branding"
  ON public.company_branding FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for audit_logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();