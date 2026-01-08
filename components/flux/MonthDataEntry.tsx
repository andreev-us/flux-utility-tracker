"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Droplets,
  Flame,
  Thermometer,
  Zap,
  Wallet,
} from "lucide-react";

interface MonthDataEntryProps {
  className?: string;
}

interface MeterCardProps {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  rate: number;
  currency: string;
  step?: number;
  maxValue?: number;
}

function MeterCard({
  label,
  icon: Icon,
  iconColor,
  bgColor,
  value,
  onChange,
  unit,
  rate,
  currency,
  step = 0.1,
  maxValue = 50,
}: MeterCardProps) {
  const cost = value * rate;

  const handleChange = useCallback(
    (val: number) => onChange(val),
    [onChange]
  );

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card p-3 sm:p-4 transition-all hover:border-primary/30 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg p-1.5 sm:p-2", bgColor)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-xs sm:text-sm truncate">{label}</p>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              @ {formatCurrency(rate, currency)}/{unit}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-sm sm:text-base font-bold tabular-nums", iconColor)}>
            {formatCurrency(cost, currency)}
          </p>
        </div>
      </div>

      {/* Value Display */}
      <div className="flex items-baseline gap-1 sm:gap-2 mb-3">
        <span className="text-lg sm:text-xl font-bold tabular-nums">{value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{unit}</span>
      </div>

      {/* Slider with aligned input */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 flex items-center">
          <Slider
            value={[value]}
            onValueChange={([v]) => handleChange(v)}
            max={maxValue}
            step={step}
          />
        </div>
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={0}
          placeholder="0"
          className="h-5 w-12 sm:w-16 font-mono text-center text-[11px] sm:text-xs px-1 py-0"
        />
      </div>
    </div>
  );
}

export function MonthDataEntry({ className }: MonthDataEntryProps) {
  const {
    settings,
    currentMonthData,
    updateUsage,
    updateElectricityUsage,
    updateAdvancePayment,
    getEffectiveQuotas,
    getEffectiveRates,
    getEffectiveElectricityRate,
  } = useSettings();

  const effectiveRates = getEffectiveRates();
  const effectiveElecRate = getEffectiveElectricityRate();
  const effectiveQuotas = getEffectiveQuotas();

  return (
    <Card className={cn("border bg-card card-shadow overflow-hidden", className)}>
      <CardContent className="p-3 sm:p-5">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-semibold text-sm sm:text-base">Meter Readings</h3>
        </div>

        {/* Meters Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <MeterCard
            label="Cold Water"
            icon={Droplets}
            iconColor="text-blue-500"
            bgColor="bg-blue-500/10"
            value={currentMonthData.usage.coldWater}
            onChange={(v) => updateUsage("coldWater", v)}
            unit="m³"
            rate={effectiveRates.coldWater}
            currency={settings.currency}
            maxValue={effectiveQuotas.waterMonth * 2}
          />

          <MeterCard
            label="Hot Water"
            icon={Flame}
            iconColor="text-orange-500"
            bgColor="bg-orange-500/10"
            value={currentMonthData.usage.hotWater}
            onChange={(v) => updateUsage("hotWater", v)}
            unit="m³"
            rate={effectiveRates.hotWaterHeating}
            currency={settings.currency}
            maxValue={effectiveQuotas.waterMonth * 2}
          />

          <MeterCard
            label="Heating"
            icon={Thermometer}
            iconColor="text-rose-500"
            bgColor="bg-rose-500/10"
            value={currentMonthData.usage.heating}
            onChange={(v) => updateUsage("heating", v)}
            unit="GJ"
            rate={effectiveRates.centralHeatingVariable}
            currency={settings.currency}
            step={0.01}
            maxValue={effectiveQuotas.heatMonth * 2}
          />

          <MeterCard
            label="Electricity"
            icon={Zap}
            iconColor="text-amber-500"
            bgColor="bg-amber-500/10"
            value={currentMonthData.electricity?.kwh || 0}
            onChange={updateElectricityUsage}
            unit="kWh"
            rate={effectiveElecRate}
            currency={settings.currency}
            step={1}
            maxValue={effectiveQuotas.electricityMonth * 2}
          />
        </div>

        {/* Advance Payment - Compact inline */}
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-xs sm:text-sm">Advance Payment</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block">Monthly prepayment</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={currentMonthData.advancePayment || ""}
              onChange={(e) => updateAdvancePayment(parseFloat(e.target.value) || 0)}
              step={0.01}
              placeholder="0.00"
              className="h-8 w-24 sm:w-28 text-sm font-bold tabular-nums text-right px-2"
            />
            <span className="text-sm font-medium text-muted-foreground">{settings.currency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
