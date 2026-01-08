export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          currency_locale: string;
          rates: {
            coldWater: number;
            hotWaterHeating: number;
            centralHeatingVariable: number;
            garbageFixed: number;
            parkingFixed: number;
            adminFixed: number;
          };
          electricity_rates: {
            perKwh: number;
          };
          quotas: {
            waterMonth: number;
            heatMonth: number;
            electricityMonth: number;
          };
          default_advance_payment: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      month_data: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          cold_water: number;
          hot_water: number;
          heating: number;
          electricity_kwh: number;
          advance_payment: number;
          notes: string | null;
          is_complete: boolean;
          overrides: {
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
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['month_data']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['month_data']['Insert']>;
      };
    };
  };
}

// Helper type for Supabase responses
export type Settings = Database['public']['Tables']['settings']['Row'];
export type MonthDataRow = Database['public']['Tables']['month_data']['Row'];
