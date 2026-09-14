-- Add additional branding fields for document headers
ALTER TABLE public.company_branding 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS phone_secondary text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account text;

-- Update document content structure to support detailed line items
COMMENT ON COLUMN public.documents.content IS 'JSONB structure: {items: [{qty: number, description: string, unit_price: number, amount: number}], labor_cost: number, notes: string, subtotal: number, tax: number, total: number, attention_to: string}';