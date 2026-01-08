"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";
import type { Settings as DBSettings, MonthDataRow } from "@/lib/supabase/database.types";

// ═══════════════════════════════════════════════════════════════
// TYPES - Invoice Data Model
// ═══════════════════════════════════════════════════════════════

export interface Rates {
  coldWater: number;
  hotWaterHeating: number;
  centralHeatingVariable: number;
  garbageFixed: number;
  parkingFixed: number;
  adminFixed: number;
}

export interface ElectricityRates {
  perKwh: number;
}

export interface Usage {
  coldWater: number;
  hotWater: number;
  heating: number;
}

export interface ElectricityUsage {
  kwh: number;
}

// Meter readings - absolute values from the meter
export interface MeterReadings {
  coldWater: number;
  hotWater: number;
  heating: number;
  electricity: number;
}

export interface Quotas {
  coldWaterMonth: number;
  hotWaterMonth: number;
  heatMonth: number;
  electricityMonth: number;
}

export interface MonthOverrides {
  quotas?: Partial<Quotas>;
  rates?: Partial<Rates>;
  electricityRate?: number;
}

export interface MonthData {
  usage: Usage;
  electricity: ElectricityUsage;
  advancePayment: number;
  notes?: string;
  overrides?: MonthOverrides;
  isComplete?: boolean; // User marked as finalized
  meterReadings?: MeterReadings; // Absolute meter values
}

export interface Settings {
  currency: string;
  currencyLocale: string;
  rates: Rates;
  electricityRates: ElectricityRates;
  quotas: Quotas;
  defaultAdvancePayment: number;
  startingMeterReadings: MeterReadings; // Initial meter values for first month
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════

const DEFAULT_RATES: Rates = {
  coldWater: 14.83,
  hotWaterHeating: 35.15,
  centralHeatingVariable: 140.61,
  garbageFixed: 188.08,
  parkingFixed: 85.10,
  adminFixed: 332.90,
};

const DEFAULT_ELECTRICITY_RATES: ElectricityRates = {
  perKwh: 0.85,
};

const DEFAULT_QUOTAS: Quotas = {
  coldWaterMonth: 4.0,
  hotWaterMonth: 4.0,
  heatMonth: 1.0,
  electricityMonth: 150,
};

const DEFAULT_USAGE: Usage = {
  coldWater: 0,
  hotWater: 0,
  heating: 0,
};

const DEFAULT_ELECTRICITY: ElectricityUsage = {
  kwh: 0,
};

const DEFAULT_METER_READINGS: MeterReadings = {
  coldWater: 0,
  hotWater: 0,
  heating: 0,
  electricity: 0,
};

const DEFAULT_SETTINGS: Settings = {
  currency: "zł",
  currencyLocale: "pl-PL",
  rates: DEFAULT_RATES,
  electricityRates: DEFAULT_ELECTRICITY_RATES,
  quotas: DEFAULT_QUOTAS,
  defaultAdvancePayment: 841.16,
  startingMeterReadings: DEFAULT_METER_READINGS,
};

// Seeded random number generator for deterministic "random" values
// This ensures SSR and CSR produce identical values
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate 12 months of DETERMINISTIC sample data for demo
// Uses seeded random to avoid hydration mismatches
function generateSampleData(): Record<string, MonthData> {
  const data: Record<string, MonthData> = {};
  const baseDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const month = date.getMonth();
    const isWinter = month >= 10 || month <= 2;
    const isSummer = month >= 5 && month <= 8;
    
    // Use deterministic seed based on year and month
    const seed = date.getFullYear() * 12 + month;
    
    const baseWaterCold = 2.0 + seededRandom(seed * 1) * 1.5;
    const baseWaterHot = 1.2 + seededRandom(seed * 2) * 1.0;
    
    let heating: number;
    if (isWinter) {
      heating = 0.8 + seededRandom(seed * 3) * 0.5;
    } else if (isSummer) {
      heating = 0.05 + seededRandom(seed * 3) * 0.1;
    } else {
      heating = 0.2 + seededRandom(seed * 3) * 0.3;
    }
    
    let electricity: number;
    if (isWinter) {
      electricity = 130 + seededRandom(seed * 4) * 50;
    } else if (isSummer) {
      electricity = 100 + seededRandom(seed * 4) * 40;
    } else {
      electricity = 90 + seededRandom(seed * 4) * 30;
    }
    
    data[key] = {
      usage: {
        coldWater: Number(baseWaterCold.toFixed(2)),
        hotWater: Number(baseWaterHot.toFixed(2)),
        heating: Number(heating.toFixed(2)),
      },
      electricity: {
        kwh: Number(electricity.toFixed(0)),
      },
      advancePayment: 841.16,
    };
  }
  
  const currentKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
  data[currentKey] = {
    usage: DEFAULT_USAGE,
    electricity: DEFAULT_ELECTRICITY,
    advancePayment: 841.16,
  };
  
  return data;
}

const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  PLN: { symbol: "zł", locale: "pl-PL" },
  EUR: { symbol: "€", locale: "de-DE" },
  USD: { symbol: "$", locale: "en-US" },
};

// ═══════════════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════════════

export interface TrendDataPoint {
  month: string;
  monthLabel: string;
  shortLabel: string;
  projectedBill: number;
  advancePayment: number;
  balance: number;
  coldWater: number;
  hotWater: number;
  heating: number;
  totalWater: number;
  variableCosts: number;
  fixedCosts: number;
  electricity: number;
  electricityCost: number;
}

interface SettingsContextType {
  settings: Settings;
  selectedMonth: string;
  availableMonths: string[];
  monthData: Record<string, MonthData>;
  currentMonthData: MonthData;
  loading: boolean;
  syncing: boolean;
  setSelectedMonth: (month: string) => void;
  updateCurrency: (currency: string) => void;
  updateRate: (key: keyof Rates, value: number) => void;
  updateRates: (rates: Partial<Rates>) => void;
  updateElectricityRate: (value: number) => void;
  updateUsage: (key: keyof Usage, value: number) => void;
  updateElectricityUsage: (value: number) => void;
  updateQuota: (key: keyof Quotas, value: number) => void;
  updateAdvancePayment: (value: number) => void;
  resetToDefaults: () => void;
  projectedBill: number;
  liveBalance: number;
  cumulativeLiveBalance: number; // Running total across all months
  fixedCosts: number;
  variableCosts: number;
  electricityCost: number;
  getTrendData: (monthsBack: number) => TrendDataPoint[];
  // Per-month overrides
  updateMonthQuota: (key: keyof Quotas, value: number) => void;
  updateMonthRate: (key: keyof Rates, value: number) => void;
  updateMonthElectricityRate: (value: number) => void;
  clearMonthOverrides: () => void;
  markMonthComplete: (complete: boolean) => void;
  updateMonthNotes: (notes: string) => void;
  getEffectiveQuotas: () => Quotas;
  getEffectiveRates: () => Rates;
  getEffectiveElectricityRate: () => number;
  addMonth: (monthKey: string) => void;
  removeMonth: (monthKey: string) => void;
  getMonthStatus: (monthKey: string) => 'empty' | 'partial' | 'complete';
  // Meter readings
  updateMeterReading: (key: keyof MeterReadings, value: number) => void;
  getPreviousMonthReadings: () => MeterReadings;
  getCalculatedUsage: () => { coldWater: number; hotWater: number; heating: number; electricity: number };
  // Starting meter readings
  updateStartingMeterReading: (key: keyof MeterReadings, value: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [monthData, setMonthData] = useState<Record<string, MonthData>>(generateSampleData);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Debounce timers
  const settingsSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const monthDataSaveTimer = useRef<NodeJS.Timeout | null>(null);
  
  const getCurrentMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  // ═══════════════════════════════════════════════════════════════
  // LOAD DATA FROM SUPABASE + REAL-TIME SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════
  
  // Helper to parse settings from DB
  const parseSettings = useCallback((settingsData: DBSettings): Settings => {
    // Handle legacy quota format (waterMonth -> coldWaterMonth/hotWaterMonth)
    const quotas = settingsData.quotas as any;
    return {
      currency: settingsData.currency,
      currencyLocale: settingsData.currency_locale,
      rates: settingsData.rates,
      electricityRates: settingsData.electricity_rates,
      quotas: {
        coldWaterMonth: quotas.coldWaterMonth ?? quotas.waterMonth ?? 4.0,
        hotWaterMonth: quotas.hotWaterMonth ?? quotas.waterMonth ?? 4.0,
        heatMonth: quotas.heatMonth ?? 1.0,
        electricityMonth: quotas.electricityMonth ?? 150,
      },
      defaultAdvancePayment: settingsData.default_advance_payment,
      startingMeterReadings: (settingsData as any).starting_meter_readings || DEFAULT_METER_READINGS,
    };
  }, []);
  
  // Helper to parse month data from DB
  const parseMonthData = useCallback((row: MonthDataRow): MonthData => {
    return {
      usage: {
        coldWater: row.cold_water,
        hotWater: row.hot_water,
        heating: row.heating,
      },
      electricity: {
        kwh: row.electricity_kwh,
      },
      advancePayment: row.advance_payment,
      notes: row.notes || undefined,
      isComplete: row.is_complete || false,
      overrides: row.overrides ? {
        quotas: row.overrides.quotas,
        rates: row.overrides.rates,
        electricityRate: row.overrides.electricityRate,
      } : undefined,
      meterReadings: row.meter_readings ? {
        coldWater: row.meter_readings.coldWater,
        hotWater: row.meter_readings.hotWater,
        heating: row.meter_readings.heating,
        electricity: row.meter_readings.electricity,
      } : undefined,
    };
  }, []);
  
  useEffect(() => {
    if (!user) {
      console.log('[Load] No user, using sample data');
      setMonthData(generateSampleData());
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      console.log('[Load] Loading data for user:', user.id);
      
      try {
        // Load settings
        const settingsResult = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        const settingsData = settingsResult.data as DBSettings | null;
        const settingsError = settingsResult.error;
        
        console.log('[Load] Settings result:', { settingsData, settingsError });
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('[Load] Settings error:', settingsError);
        }
        
        if (settingsData) {
          setSettings(parseSettings(settingsData));
        } else {
          // New user - use defaults (not sample data)
          setSettings(DEFAULT_SETTINGS);
        }
        
        // Load month data
        const monthResult = await supabase
          .from('month_data')
          .select('*')
          .eq('user_id', user.id);
        
        const monthDataRows = monthResult.data as MonthDataRow[] | null;
        const monthError = monthResult.error;
        
        console.log('[Load] Month data result:', { monthDataRows, monthError });
        
        if (monthError) {
          console.error('[Load] Month data error:', monthError);
        }
        
        if (monthDataRows && monthDataRows.length > 0) {
          const loaded: Record<string, MonthData> = {};
          monthDataRows.forEach((row) => {
            loaded[row.month] = parseMonthData(row);
          });
          setMonthData(loaded);
          console.log('[Load] Loaded month data:', loaded);
        } else {
          // New user - start with empty data, not sample data
          setMonthData({});
          console.log('[Load] No month data found, starting fresh');
        }
      } catch (error) {
        console.error('[Load] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Set up real-time subscriptions
    const settingsChannel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Settings change:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as DBSettings;
            setSettings(parseSettings(newData));
          }
        }
      )
      .subscribe();
    
    const monthDataChannel = supabase
      .channel('month-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'month_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Month data change:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const row = payload.new as MonthDataRow;
            setMonthData((prev) => ({
              ...prev,
              [row.month]: parseMonthData(row),
            }));
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as MonthDataRow;
            setMonthData((prev) => {
              const { [row.month]: removed, ...rest } = prev;
              return rest;
            });
          }
        }
      )
      .subscribe();
    
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(monthDataChannel);
    };
  }, [user, supabase, parseSettings, parseMonthData]);

  // ═══════════════════════════════════════════════════════════════
  // SAVE SETTINGS TO SUPABASE (debounced)
  // ═══════════════════════════════════════════════════════════════
  
  const saveSettings = useCallback(async (newSettings: Settings) => {
    if (!user) {
      console.log('[Settings] No user logged in, skipping save');
      return;
    }
    
    setSyncing(true);
    console.log('[Settings] Saving settings for user:', user.id);
    
    try {
      const payload = {
        user_id: user.id,
        currency: newSettings.currency,
        currency_locale: newSettings.currencyLocale,
        rates: newSettings.rates,
        electricity_rates: newSettings.electricityRates,
        quotas: newSettings.quotas,
        default_advance_payment: newSettings.defaultAdvancePayment,
        starting_meter_readings: newSettings.startingMeterReadings,
        updated_at: new Date().toISOString(),
      };
      
      console.log('[Settings] Upsert payload:', payload);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert(payload, {
          onConflict: 'user_id',
        })
        .select();
      
      if (error) {
        console.error('[Settings] Supabase error:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('[Settings] Saved successfully:', data);
    } catch (error) {
      console.error('[Settings] Error saving settings:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, supabase]);

  const debouncedSaveSettings = useCallback((newSettings: Settings) => {
    if (settingsSaveTimer.current) {
      clearTimeout(settingsSaveTimer.current);
    }
    settingsSaveTimer.current = setTimeout(() => {
      saveSettings(newSettings);
    }, 1000);
  }, [saveSettings]);

  // ═══════════════════════════════════════════════════════════════
  // SAVE MONTH DATA TO SUPABASE (debounced)
  // ═══════════════════════════════════════════════════════════════
  
  const saveMonthData = useCallback(async (month: string, monthDataToSave: MonthData) => {
    if (!user) {
      console.log('[MonthData] No user logged in, skipping save');
      return;
    }
    
    setSyncing(true);
    console.log('[MonthData] Saving month data for user:', user.id, 'month:', month);
    
    try {
      const payload = {
        user_id: user.id,
        month,
        cold_water: monthDataToSave.usage.coldWater,
        hot_water: monthDataToSave.usage.hotWater,
        heating: monthDataToSave.usage.heating,
        electricity_kwh: monthDataToSave.electricity.kwh,
        advance_payment: monthDataToSave.advancePayment,
        notes: monthDataToSave.notes || null,
        is_complete: monthDataToSave.isComplete || false,
        overrides: monthDataToSave.overrides || null,
        meter_readings: monthDataToSave.meterReadings || null,
        updated_at: new Date().toISOString(),
      };
      
      console.log('[MonthData] Upsert payload:', payload);
      
      const { data: result, error } = await supabase
        .from('month_data')
        .upsert(payload, {
          onConflict: 'user_id,month',
        })
        .select();
      
      if (error) {
        console.error('[MonthData] Supabase error:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('[MonthData] Saved successfully:', result);
    } catch (error) {
      console.error('[MonthData] Error saving month data:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, supabase]);

  const debouncedSaveMonthData = useCallback((month: string, data: MonthData) => {
    if (monthDataSaveTimer.current) {
      clearTimeout(monthDataSaveTimer.current);
    }
    monthDataSaveTimer.current = setTimeout(() => {
      saveMonthData(month, data);
    }, 500);
  }, [saveMonthData]);

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════

  const availableMonths = useMemo(() => {
    return Object.keys(monthData).sort((a, b) => b.localeCompare(a));
  }, [monthData]);

  const currentMonthData = useMemo(() => {
    return monthData[selectedMonth] || {
      usage: DEFAULT_USAGE,
      electricity: DEFAULT_ELECTRICITY,
      advancePayment: settings.defaultAdvancePayment,
    };
  }, [monthData, selectedMonth, settings.defaultAdvancePayment]);

  // ═══════════════════════════════════════════════════════════════
  // UPDATE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const updateCurrency = useCallback((currencyCode: string) => {
    const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.PLN;
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        currency: config.symbol,
        currencyLocale: config.locale,
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const updateRate = useCallback((key: keyof Rates, value: number) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        rates: { ...prev.rates, [key]: value },
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const updateRates = useCallback((rates: Partial<Rates>) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        rates: { ...prev.rates, ...rates },
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const updateElectricityRate = useCallback((value: number) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        electricityRates: { perKwh: value },
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const updateUsage = useCallback((key: keyof Usage, value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = {
        ...currentData,
        usage: {
          ...currentData.usage,
          [key]: Math.max(0, value),
        },
      };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const updateElectricityUsage = useCallback((value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = {
        ...currentData,
        electricity: { kwh: Math.max(0, value) },
      };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const updateQuota = useCallback((key: keyof Quotas, value: number) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        quotas: { ...prev.quotas, [key]: value },
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const updateAdvancePayment = useCallback((value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = { ...currentData, advancePayment: value };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  // Get the previous month key
  const getPreviousMonthKey = useCallback((currentMonth: string): string | null => {
    const sortedMonths = Object.keys(monthData).sort();
    const currentIndex = sortedMonths.indexOf(currentMonth);
    if (currentIndex <= 0) return null;
    return sortedMonths[currentIndex - 1];
  }, [monthData]);

  // Get meter readings from previous month (or starting readings if first month)
  const getPreviousMonthReadings = useCallback((): MeterReadings => {
    const prevMonthKey = getPreviousMonthKey(selectedMonth);
    if (!prevMonthKey) {
      // First month - use starting meter readings from settings
      return settings.startingMeterReadings;
    }
    const prevData = monthData[prevMonthKey];
    return prevData?.meterReadings || settings.startingMeterReadings;
  }, [selectedMonth, monthData, getPreviousMonthKey, settings.startingMeterReadings]);

  // Calculate usage from meter readings (current - previous)
  const getCalculatedUsage = useCallback(() => {
    const current = currentMonthData.meterReadings || DEFAULT_METER_READINGS;
    const previous = getPreviousMonthReadings();
    
    return {
      coldWater: Math.max(0, current.coldWater - previous.coldWater),
      hotWater: Math.max(0, current.hotWater - previous.hotWater),
      heating: Math.max(0, current.heating - previous.heating),
      electricity: Math.max(0, current.electricity - previous.electricity),
    };
  }, [currentMonthData.meterReadings, getPreviousMonthReadings]);

  // Update meter reading and auto-calculate usage
  const updateMeterReading = useCallback((key: keyof MeterReadings, value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      
      const newMeterReadings = {
        ...DEFAULT_METER_READINGS,
        ...currentData.meterReadings,
        [key]: Math.max(0, value),
      };
      
      // Get previous month readings for usage calculation (use starting readings if no prev month)
      const sortedMonths = Object.keys(prev).sort();
      const currentIndex = sortedMonths.indexOf(selectedMonth);
      const prevMonthKey = currentIndex > 0 ? sortedMonths[currentIndex - 1] : null;
      const prevReadings = prevMonthKey 
        ? prev[prevMonthKey]?.meterReadings || settings.startingMeterReadings 
        : settings.startingMeterReadings;
      
      // Calculate usage based on the difference
      const calculatedUsage = {
        coldWater: Math.max(0, newMeterReadings.coldWater - prevReadings.coldWater),
        hotWater: Math.max(0, newMeterReadings.hotWater - prevReadings.hotWater),
        heating: Math.max(0, newMeterReadings.heating - prevReadings.heating),
      };
      
      const calculatedElectricity = Math.max(0, newMeterReadings.electricity - prevReadings.electricity);
      
      const newData = {
        ...currentData,
        meterReadings: newMeterReadings,
        usage: calculatedUsage,
        electricity: { kwh: calculatedElectricity },
      };
      
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, settings.startingMeterReadings, debouncedSaveMonthData]);

  const updateStartingMeterReading = useCallback((key: keyof MeterReadings, value: number) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        startingMeterReadings: {
          ...prev.startingMeterReadings,
          [key]: Math.max(0, value),
        },
      };
      debouncedSaveSettings(newSettings);
      return newSettings;
    });
  }, [debouncedSaveSettings]);

  const resetToDefaults = useCallback(() => {
    const zeroSettings: Settings = {
      currency: "zł",
      currencyLocale: "pl-PL",
      rates: {
        coldWater: 0,
        hotWaterHeating: 0,
        centralHeatingVariable: 0,
        garbageFixed: 0,
        parkingFixed: 0,
        adminFixed: 0,
      },
      electricityRates: { perKwh: 0 },
      quotas: { coldWaterMonth: 0, hotWaterMonth: 0, heatMonth: 0, electricityMonth: 0 },
      defaultAdvancePayment: 0,
      startingMeterReadings: DEFAULT_METER_READINGS,
    };
    setSettings(zeroSettings);
    debouncedSaveSettings(zeroSettings);
  }, [debouncedSaveSettings]);

  // ═══════════════════════════════════════════════════════════════
  // PER-MONTH OVERRIDE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const updateMonthQuota = useCallback((key: keyof Quotas, value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = {
        ...currentData,
        overrides: {
          ...currentData.overrides,
          quotas: {
            ...currentData.overrides?.quotas,
            [key]: value,
          },
        },
      };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const updateMonthRate = useCallback((key: keyof Rates, value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = {
        ...currentData,
        overrides: {
          ...currentData.overrides,
          rates: {
            ...currentData.overrides?.rates,
            [key]: value,
          },
        },
      };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const updateMonthElectricityRate = useCallback((value: number) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = {
        ...currentData,
        overrides: {
          ...currentData.overrides,
          electricityRate: value,
        },
      };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const clearMonthOverrides = useCallback(() => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth];
      if (!currentData) return prev;
      const { overrides, ...rest } = currentData;
      const newData = rest as MonthData;
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, debouncedSaveMonthData]);

  const markMonthComplete = useCallback((complete: boolean) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = { ...currentData, isComplete: complete };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const updateMonthNotes = useCallback((notes: string) => {
    setMonthData((prev) => {
      const currentData = prev[selectedMonth] || {
        usage: DEFAULT_USAGE,
        electricity: DEFAULT_ELECTRICITY,
        advancePayment: settings.defaultAdvancePayment,
      };
      const newData = { ...currentData, notes: notes || undefined };
      debouncedSaveMonthData(selectedMonth, newData);
      return { ...prev, [selectedMonth]: newData };
    });
  }, [selectedMonth, settings.defaultAdvancePayment, debouncedSaveMonthData]);

  const getEffectiveQuotas = useCallback((): Quotas => {
    const overrides = currentMonthData.overrides?.quotas || {} as any;
    return {
      coldWaterMonth: overrides.coldWaterMonth ?? overrides.waterMonth ?? settings.quotas.coldWaterMonth,
      hotWaterMonth: overrides.hotWaterMonth ?? overrides.waterMonth ?? settings.quotas.hotWaterMonth,
      heatMonth: overrides.heatMonth ?? settings.quotas.heatMonth,
      electricityMonth: overrides.electricityMonth ?? settings.quotas.electricityMonth,
    };
  }, [currentMonthData.overrides?.quotas, settings.quotas]);

  const getEffectiveRates = useCallback((): Rates => {
    const overrides = currentMonthData.overrides?.rates || {};
    return {
      coldWater: overrides.coldWater ?? settings.rates.coldWater,
      hotWaterHeating: overrides.hotWaterHeating ?? settings.rates.hotWaterHeating,
      centralHeatingVariable: overrides.centralHeatingVariable ?? settings.rates.centralHeatingVariable,
      garbageFixed: overrides.garbageFixed ?? settings.rates.garbageFixed,
      parkingFixed: overrides.parkingFixed ?? settings.rates.parkingFixed,
      adminFixed: overrides.adminFixed ?? settings.rates.adminFixed,
    };
  }, [currentMonthData.overrides?.rates, settings.rates]);

  const getEffectiveElectricityRate = useCallback((): number => {
    return currentMonthData.overrides?.electricityRate ?? settings.electricityRates.perKwh;
  }, [currentMonthData.overrides?.electricityRate, settings.electricityRates.perKwh]);

  const addMonth = useCallback((monthKey: string) => {
    const newData: MonthData = {
      usage: DEFAULT_USAGE,
      electricity: DEFAULT_ELECTRICITY,
      advancePayment: settings.defaultAdvancePayment,
    };

    setMonthData((prev) => {
      if (prev[monthKey]) return prev;
      return { ...prev, [monthKey]: newData };
    });
    
    // Save immediately (no debounce) to ensure creation is persisted
    saveMonthData(monthKey, newData);
  }, [settings.defaultAdvancePayment, saveMonthData]);

  const removeMonth = useCallback(async (monthKey: string) => {
    // Remove from local state
    setMonthData((prev) => {
      const { [monthKey]: removed, ...rest } = prev;
      return rest;
    });
    
    // Remove from database if user is logged in
    if (user) {
      try {
        await supabase
          .from('month_data')
          .delete()
          .eq('user_id', user.id)
          .eq('month', monthKey);
      } catch (error) {
        console.error('[MonthData] Error deleting month:', error);
      }
    }
  }, [user, supabase]);

  const getMonthStatus = useCallback((monthKey: string): 'empty' | 'partial' | 'complete' => {
    const data = monthData[monthKey];
    if (!data) return 'empty';
    if (data.isComplete) return 'complete';
    
    const hasUsage = data.usage.coldWater > 0 || data.usage.hotWater > 0 || data.usage.heating > 0;
    const hasElectricity = (data.electricity?.kwh || 0) > 0;
    
    if (hasUsage || hasElectricity) return 'partial';
    return 'empty';
  }, [monthData]);

  // ═══════════════════════════════════════════════════════════════
  // CALCULATIONS
  // ═══════════════════════════════════════════════════════════════

  const fixedCosts = useMemo(() => 
    settings.rates.garbageFixed +
    settings.rates.parkingFixed +
    settings.rates.adminFixed,
    [settings.rates]
  );

  const variableCosts = useMemo(() =>
    currentMonthData.usage.coldWater * settings.rates.coldWater +
    currentMonthData.usage.hotWater * settings.rates.hotWaterHeating +
    currentMonthData.usage.heating * settings.rates.centralHeatingVariable,
    [currentMonthData.usage, settings.rates]
  );

  const projectedBill = fixedCosts + variableCosts;
  const liveBalance = currentMonthData.advancePayment - projectedBill;

  const electricityCost = useMemo(() =>
    (currentMonthData.electricity?.kwh || 0) * settings.electricityRates.perKwh,
    [currentMonthData.electricity, settings.electricityRates]
  );

  // Cumulative live balance across ALL months
  const cumulativeLiveBalance = useMemo(() => {
    let total = 0;
    Object.values(monthData).forEach((data) => {
      const variable =
        data.usage.coldWater * settings.rates.coldWater +
        data.usage.hotWater * settings.rates.hotWaterHeating +
        data.usage.heating * settings.rates.centralHeatingVariable;
      const monthProjected = fixedCosts + variable;
      const monthBalance = data.advancePayment - monthProjected;
      total += monthBalance;
    });
    return total;
  }, [monthData, settings.rates, fixedCosts]);

  const getTrendData = useCallback((monthsBack: number): TrendDataPoint[] => {
    const sortedMonths = availableMonths.slice().reverse();
    const selectedIndex = sortedMonths.findIndex(m => m === selectedMonth);
    
    const relevantMonths = sortedMonths
      .slice(Math.max(0, selectedIndex - monthsBack + 1), selectedIndex + 1);
    
    return relevantMonths.map((month) => {
      const data = monthData[month];
      const variable =
        data.usage.coldWater * settings.rates.coldWater +
        data.usage.hotWater * settings.rates.hotWaterHeating +
        data.usage.heating * settings.rates.centralHeatingVariable;
      const projected = fixedCosts + variable;
      const balance = data.advancePayment - projected;
      const elecCost = (data.electricity?.kwh || 0) * settings.electricityRates.perKwh;
      
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      
      return {
        month,
        monthLabel: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortLabel: date.toLocaleDateString('en-US', { month: 'short' }),
        projectedBill: projected,
        advancePayment: data.advancePayment,
        balance,
        coldWater: data.usage.coldWater,
        hotWater: data.usage.hotWater,
        heating: data.usage.heating,
        totalWater: data.usage.coldWater + data.usage.hotWater,
        variableCosts: variable,
        fixedCosts,
        electricity: data.electricity?.kwh || 0,
        electricityCost: elecCost,
      };
    });
  }, [availableMonths, selectedMonth, monthData, settings.rates, settings.electricityRates, fixedCosts]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        selectedMonth,
        availableMonths,
        monthData,
        currentMonthData,
        loading,
        syncing,
        setSelectedMonth,
        updateCurrency,
        updateRate,
        updateRates,
        updateElectricityRate,
        updateUsage,
        updateElectricityUsage,
        updateQuota,
        updateAdvancePayment,
        resetToDefaults,
        projectedBill,
        liveBalance,
        cumulativeLiveBalance,
        fixedCosts,
        variableCosts,
        electricityCost,
        getTrendData,
        // Per-month overrides
        updateMonthQuota,
        updateMonthRate,
        updateMonthElectricityRate,
        clearMonthOverrides,
        markMonthComplete,
        updateMonthNotes,
        getEffectiveQuotas,
        getEffectiveRates,
        getEffectiveElectricityRate,
        addMonth,
        removeMonth,
        getMonthStatus,
        // Meter readings
        updateMeterReading,
        getPreviousMonthReadings,
        getCalculatedUsage,
        // Starting meter readings
        updateStartingMeterReading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
