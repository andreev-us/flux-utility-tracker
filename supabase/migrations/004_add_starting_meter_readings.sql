-- ═══════════════════════════════════════════════════════════════
-- ADD STARTING METER READINGS TO SETTINGS TABLE
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Add starting_meter_readings column to store initial meter values
-- Format: { "coldWater": 123.45, "hotWater": 67.89, "heating": 1.23, "electricity": 4567 }
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS starting_meter_readings JSONB DEFAULT '{"coldWater": 0, "hotWater": 0, "heating": 0, "electricity": 0}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.settings.starting_meter_readings IS 'Initial meter reading values for calculating usage in the first month';
