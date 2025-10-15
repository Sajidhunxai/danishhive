-- Update default status for contracts table to 'sent'
ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'sent';