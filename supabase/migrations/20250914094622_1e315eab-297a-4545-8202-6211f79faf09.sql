-- Add contract completion functionality and escrow support
-- Update contracts table to properly support metadata and status tracking

-- First, ensure metadata column exists and add any missing status values
DO $$ 
BEGIN
    -- Check if metadata column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.contracts ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create a function to handle escrow payment status updates
CREATE OR REPLACE FUNCTION public.update_contract_escrow_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a contract's escrow status changes to 'paid', mark contract as active
  IF NEW.metadata->>'escrow_status' = 'paid' AND 
     (OLD.metadata->>'escrow_status' IS NULL OR OLD.metadata->>'escrow_status' != 'paid') THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for escrow status updates
DROP TRIGGER IF EXISTS contract_escrow_status_trigger ON public.contracts;
CREATE TRIGGER contract_escrow_status_trigger
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contract_escrow_status();

-- Create an index on metadata for better performance when querying escrow status
CREATE INDEX IF NOT EXISTS idx_contracts_metadata_escrow 
ON public.contracts USING GIN ((metadata->>'escrow_status'));

-- Create an index on contract status for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_status 
ON public.contracts (status);

-- Update any existing signed contracts to have proper metadata structure
UPDATE public.contracts 
SET metadata = COALESCE(metadata, '{}')
WHERE metadata IS NULL;