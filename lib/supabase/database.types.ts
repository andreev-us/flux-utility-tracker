export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Base types for nested JSON objects
export interface RatesJson {
  coldWater: number;
  hotWaterHeating: number;
  centralHeatingVariable: number;
  garbageFixed: number;
  parkingFixed: number;
  adminFixed: number;
}

export interface ElectricityRatesJson {
  perKwh: number;
}

export interface QuotasJson {
  waterMonth: number;
  heatMonth: number;
  electricityMonth: number;
}

export interface OverridesJson {
  quotas?: {
    waterMonth?: number;
    heatMonth?: number;
    electricityMonth?: number;
  };
  rates?: {
    coldWater?: number;
    hotWaterHeating?: number;
    centralHeatingVariable?: number;
    garbageFixed?: number;
    parkingFixed?: number;
    adminFixed?: number;
  };
  electricityRate?: number;
}

export interface Database {
  public: {
    Tables: {
      month_data: {
        Row: {
          advance_payment: number
          cold_water: number
          created_at: string
          electricity_kwh: number
          heating: number
          hot_water: number
          id: string
          is_complete: boolean
          month: string
          notes: string | null
          overrides: OverridesJson | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_payment: number
          cold_water: number
          created_at?: string
          electricity_kwh: number
          heating: number
          hot_water: number
          id?: string
          is_complete?: boolean
          month: string
          notes?: string | null
          overrides?: OverridesJson | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_payment?: number
          cold_water?: number
          created_at?: string
          electricity_kwh?: number
          heating?: number
          hot_water?: number
          id?: string
          is_complete?: boolean
          month?: string
          notes?: string | null
          overrides?: OverridesJson | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          currency: string
          currency_locale: string
          default_advance_payment: number
          electricity_rates: ElectricityRatesJson
          id: string
          quotas: QuotasJson
          rates: RatesJson
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          currency_locale: string
          default_advance_payment: number
          electricity_rates: ElectricityRatesJson
          id?: string
          quotas: QuotasJson
          rates: RatesJson
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          currency_locale?: string
          default_advance_payment?: number
          electricity_rates?: ElectricityRatesJson
          id?: string
          quotas?: QuotasJson
          rates?: RatesJson
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper type aliases for Supabase responses
export type Settings = Database['public']['Tables']['settings']['Row'];
export type SettingsInsert = Database['public']['Tables']['settings']['Insert'];
export type MonthDataRow = Database['public']['Tables']['month_data']['Row'];
export type MonthDataInsert = Database['public']['Tables']['month_data']['Insert'];
