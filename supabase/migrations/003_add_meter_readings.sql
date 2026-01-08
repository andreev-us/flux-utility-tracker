-- ═══════════════════════════════════════════════════════════════
-- ADD METER READINGS COLUMN TO MONTH DATA TABLE
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Add meter_readings column to store absolute meter values
-- Format: { "coldWater": 123.45, "hotWater": 67.89, "heating": 1.23, "electricity": 4567 }
ALTER TABLE public.month_data 
ADD COLUMN IF NOT EXISTS meter_readings JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.month_data.meter_readings IS 'Absolute meter reading values for calculating usage from previous month';
