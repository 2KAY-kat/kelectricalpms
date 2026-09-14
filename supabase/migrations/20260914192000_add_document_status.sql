-- Add status column to documents table for draft system
-- 'draft' = work in progress, 'final' = completed document
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Set all existing documents to 'final' since they were already saved/committed
UPDATE public.documents SET status = 'final' WHERE status = 'draft';

-- Add check constraint for valid statuses
ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check CHECK (status IN ('draft', 'final'));

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);
