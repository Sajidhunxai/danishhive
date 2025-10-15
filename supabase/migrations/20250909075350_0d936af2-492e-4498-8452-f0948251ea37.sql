-- Remove draft status from contracts and update contract status constraint
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Add new constraint without draft
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('sent', 'signed'));

-- Update any existing draft contracts to sent status
UPDATE contracts SET status = 'sent' WHERE status = 'draft';