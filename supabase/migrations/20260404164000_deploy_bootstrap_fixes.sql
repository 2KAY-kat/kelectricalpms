-- Ensure the first real user in a fresh project becomes admin.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role := 'employee';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill an admin when migrations ran before any users existed.
WITH first_user AS (
  SELECT user_id
  FROM public.user_roles
  ORDER BY created_at ASC
  LIMIT 1
)
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT user_id FROM first_user)
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  );

-- Match branding access with the app, which allows managers and admins.
DROP POLICY IF EXISTS "Only admins can update company branding" ON public.company_branding;
DROP POLICY IF EXISTS "Only admins can insert company branding" ON public.company_branding;

CREATE POLICY "Managers and admins can update company branding"
  ON public.company_branding FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers and admins can insert company branding"
  ON public.company_branding FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager_or_admin(auth.uid()));
