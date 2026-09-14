-- Drop the security definer view as it bypasses RLS
DROP VIEW IF EXISTS public.projects_employee_view;

-- The column-level security will be handled in the application layer
-- The RLS policies already restrict access appropriately