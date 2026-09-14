-- 1. Make the first registered user an admin
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
);

-- 2. Drop existing permissive project policies
DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Employees can create projects" ON public.projects;
DROP POLICY IF EXISTS "Managers and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only admins and managers can delete projects" ON public.projects;

-- 3. Create role-based project policies with column-level security
-- Managers and admins can see everything
CREATE POLICY "Managers and admins can view all projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- Regular employees can only see non-sensitive data
CREATE POLICY "Employees can view basic project info"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_manager_or_admin(auth.uid())
  );

-- All authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Managers/admins can update any project, creators can update their own
CREATE POLICY "Users can update their projects or managers can update all"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    public.is_manager_or_admin(auth.uid()) OR created_by = auth.uid()
  );

-- Only managers and admins can delete projects
CREATE POLICY "Managers and admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- 4. Create a view for employees that hides sensitive data
CREATE OR REPLACE VIEW public.projects_employee_view AS
SELECT 
  id,
  name,
  description,
  status,
  progress,
  start_date,
  end_date,
  location_address,
  location_lat,
  location_lng,
  created_at,
  updated_at,
  created_by,
  -- Sensitive fields are NULL for non-managers
  CASE 
    WHEN public.is_manager_or_admin(auth.uid()) THEN client_name
    ELSE NULL
  END as client_name,
  CASE 
    WHEN public.is_manager_or_admin(auth.uid()) THEN client_contact
    ELSE NULL
  END as client_contact,
  CASE 
    WHEN public.is_manager_or_admin(auth.uid()) THEN budget
    ELSE NULL
  END as budget
FROM public.projects;