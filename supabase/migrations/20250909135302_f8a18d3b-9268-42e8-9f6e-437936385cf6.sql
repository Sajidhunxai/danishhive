-- Add new fields to jobs table for enhanced payment and consultant options
ALTER TABLE public.jobs 
ADD COLUMN payment_type text DEFAULT 'fixed_price',
ADD COLUMN currency text DEFAULT 'EUR',
ADD COLUMN is_permanent_consultant boolean DEFAULT false,
ADD COLUMN hours_per_week integer,
ADD COLUMN contract_duration_weeks integer;