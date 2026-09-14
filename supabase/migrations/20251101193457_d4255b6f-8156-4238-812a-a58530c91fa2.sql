-- Add columns for project phase tracking
ALTER TABLE public.projects 
ADD COLUMN current_phase text DEFAULT 'planning',
ADD COLUMN phases jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase_history jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.current_phase IS 'Current phase of the project (e.g., planning, tubing, wiring, etc.)';
COMMENT ON COLUMN public.projects.phases IS 'Array of custom phase names for this project';
COMMENT ON COLUMN public.projects.phase_history IS 'History of phase changes with timestamps';

-- Add project_id reference to bulletin_posts for project updates
ALTER TABLE public.bulletin_posts
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.bulletin_posts.project_id IS 'Optional reference to a project for project update posts';