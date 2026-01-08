-- ═══════════════════════════════════════════════════════════════
-- FINANCE APP DATABASE SCHEMA (FRESH START)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. CLEANUP
-- Use CASCADE to automatically remove dependent objects (triggers, policies, etc.)
DROP TABLE IF EXISTS public.month_data CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE SETTINGS TABLE
CREATE TABLE public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'zł',
  currency_locale TEXT NOT NULL DEFAULT 'pl-PL',
  rates JSONB NOT NULL DEFAULT '{
    "coldWater": 14.83,
    "hotWaterHeating": 35.15,
    "centralHeatingVariable": 140.61,
    "garbageFixed": 188.08,
    "parkingFixed": 85.10,
    "adminFixed": 332.90
  }'::jsonb,
  electricity_rates JSONB NOT NULL DEFAULT '{"perKwh": 0.85}'::jsonb,
  quotas JSONB NOT NULL DEFAULT '{
    "waterMonth": 4.0,
    "heatMonth": 1.0,
    "electricityMonth": 150
  }'::jsonb,
  default_advance_payment DECIMAL(10,2) NOT NULL DEFAULT 841.16,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one settings row per user
  CONSTRAINT settings_user_id_unique UNIQUE (user_id)
);

-- 4. CREATE MONTH DATA TABLE
CREATE TABLE public.month_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-01')
  cold_water DECIMAL(10,2) NOT NULL DEFAULT 0,
  hot_water DECIMAL(10,2) NOT NULL DEFAULT 0,
  heating DECIMAL(10,2) NOT NULL DEFAULT 0,
  electricity_kwh DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_payment DECIMAL(10,2) NOT NULL DEFAULT 841.16,
  notes TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  overrides JSONB, -- Store per-month rate/quota overrides
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one row per user per month
  CONSTRAINT month_data_user_month_unique UNIQUE (user_id, month)
);

-- 5. CREATE INDEXES
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_month_data_user_id ON public.month_data(user_id);
CREATE INDEX idx_month_data_month ON public.month_data(month);
CREATE INDEX idx_month_data_user_month ON public.month_data(user_id, month);

-- 6. ENABLE RLS (Security)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_data ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- Settings
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.settings
  FOR DELETE USING (auth.uid() = user_id);

-- Month Data
CREATE POLICY "Users can view own month data" ON public.month_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own month data" ON public.month_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own month data" ON public.month_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own month data" ON public.month_data
  FOR DELETE USING (auth.uid() = user_id);

-- 8. SETUP AUTOMATIC TIMESTAMP UPDATES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_month_data_updated_at
  BEFORE UPDATE ON public.month_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. GRANT PERMISSIONS
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.month_data TO authenticated;
GRANT ALL ON public.settings TO service_role;
GRANT ALL ON public.month_data TO service_role;
