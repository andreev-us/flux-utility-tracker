"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface MeterReadingCardProps {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  currentReading: number;
  previousReading: number;
  usage: number;
  onReadingChange: (value: number) => void;
  unit: string;
  rate: number;
  currency: string;
  step?: number;
}

function MeterReadingCard({
  label,
  icon: Icon,
  iconColor,
  bgColor,
  currentReading,
  previousReading,
  usage,
  onReadingChange,
  unit,
  rate,
  currency,
  step = 0.01,
}: MeterReadingCardProps) {
  const cost = usage * rate;

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

      {/* Meter Reading Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 shrink-0">Reading:</label>
          <Input
            type="number"
            value={currentReading || ""}
            onChange={(e) => onReadingChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
            step={step}
            min={0}
            placeholder="0.00"
            className="h-7 font-mono text-sm tabular-nums"
          />
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
        
        {/* Previous reading and usage */}
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Prev:</span>
            <span className="font-mono font-medium tabular-nums">{previousReading.toFixed(step < 0.1 ? 2 : 1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("font-mono font-bold tabular-nums", iconColor)}>
              {usage.toFixed(step < 0.1 ? 2 : 1)}
            </span>
            <span className="text-muted-foreground">{unit}</span>
            <span className="text-muted-foreground">(usage)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MonthDataEntry({ className }: MonthDataEntryProps) {
  const {
    settings,
    currentMonthData,
    updateAdvancePayment,
    getEffectiveRates,
    getEffectiveElectricityRate,
    updateMeterReading,
    getPreviousMonthReadings,
    getCalculatedUsage,
  } = useSettings();

  const effectiveRates = getEffectiveRates();
  const effectiveElecRate = getEffectiveElectricityRate();
  
  const currentReadings = currentMonthData.meterReadings || {
    coldWater: 0,
    hotWater: 0,
    heating: 0,
    electricity: 0,
  };
  
  const previousReadings = getPreviousMonthReadings() || {
    coldWater: 0,
    hotWater: 0,
    heating: 0,
    electricity: 0,
  };
  
  const calculatedUsage = getCalculatedUsage();

  return (
    <Card className={cn("border bg-card card-shadow overflow-hidden", className)}>
      <CardContent className="p-3 sm:p-5">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-semibold text-sm sm:text-base">Meter Readings</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Enter current meter values • Usage is calculated automatically
          </p>
        </div>

        {/* Meters Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MeterReadingCard
            label="Cold Water"
            icon={Droplets}
            iconColor="text-blue-500"
            bgColor="bg-blue-500/10"
            currentReading={currentReadings.coldWater}
            previousReading={previousReadings.coldWater}
            usage={calculatedUsage.coldWater}
            onReadingChange={(v) => updateMeterReading("coldWater", v)}
            unit="m³"
            rate={effectiveRates.coldWater}
            currency={settings.currency}
            step={0.01}
          />

          <MeterReadingCard
            label="Hot Water"
            icon={Flame}
            iconColor="text-orange-500"
            bgColor="bg-orange-500/10"
            currentReading={currentReadings.hotWater}
            previousReading={previousReadings.hotWater}
            usage={calculatedUsage.hotWater}
            onReadingChange={(v) => updateMeterReading("hotWater", v)}
            unit="m³"
            rate={effectiveRates.hotWaterHeating}
            currency={settings.currency}
            step={0.01}
          />

          <MeterReadingCard
            label="Heating"
            icon={Thermometer}
            iconColor="text-rose-500"
            bgColor="bg-rose-500/10"
            currentReading={currentReadings.heating}
            previousReading={previousReadings.heating}
            usage={calculatedUsage.heating}
            onReadingChange={(v) => updateMeterReading("heating", v)}
            unit="GJ"
            rate={effectiveRates.centralHeatingVariable}
            currency={settings.currency}
            step={0.001}
          />

          <MeterReadingCard
            label="Electricity"
            icon={Zap}
            iconColor="text-amber-500"
            bgColor="bg-amber-500/10"
            currentReading={currentReadings.electricity}
            previousReading={previousReadings.electricity}
            usage={calculatedUsage.electricity}
            onReadingChange={(v) => updateMeterReading("electricity", v)}
            unit="kWh"
            rate={effectiveElecRate}
            currency={settings.currency}
            step={1}
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
              onChange={(e) => updateAdvancePayment(e.target.value === "" ? 0 : parseFloat(e.target.value))}
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
