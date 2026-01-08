"use client";

import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Droplets, Flame, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageTrackerProps {
  className?: string;
}

interface UsageCardProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  progressColor: string;
  value: number;
  maxValue: number;
  unit: string;
  cost: number;
  currency: string;
  quota: number;
  onChange: (value: number) => void;
  step?: number;
}

function UsageCard({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  progressColor,
  value,
  maxValue,
  unit,
  cost,
  currency,
  quota,
  onChange,
  step = 0.1,
}: UsageCardProps) {
  const percent = Math.min((value / quota) * 100, 100);
  const isOverQuota = value > quota;

  return (
    <Card className="border bg-card card-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("rounded-lg p-1.5", bgColor)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <span className="font-medium text-sm">{title}</span>
          </div>
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(cost, currency)}
          </span>
        </div>

        {/* Value + Input Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Slider
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              max={maxValue}
              step={step}
              className="py-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              step={step}
              min={0}
              className="h-8 w-20 font-mono text-center text-sm"
            />
            <span className="text-xs text-muted-foreground w-6">{unit}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <Progress
            value={percent}
            className="h-1.5"
            indicatorClassName={cn(
              progressColor,
              isOverQuota && "bg-destructive"
            )}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(percent)}% of {formatNumber(quota)} {unit}</span>
            <span className={cn(isOverQuota && "text-destructive font-medium")}>
              {isOverQuota ? "Over" : "OK"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { settings, currentMonthData, updateUsage, getEffectiveQuotas, getEffectiveRates } = useSettings();
  const usage = currentMonthData.usage;
  const effectiveQuotas = getEffectiveQuotas();
  const effectiveRates = getEffectiveRates();

  const handleColdWaterChange = useCallback(
    (value: number) => updateUsage("coldWater", value),
    [updateUsage]
  );

  const handleHotWaterChange = useCallback(
    (value: number) => updateUsage("hotWater", value),
    [updateUsage]
  );

  const handleHeatingChange = useCallback(
    (value: number) => updateUsage("heating", value),
    [updateUsage]
  );

  return (
    <div className={cn("grid gap-3 md:grid-cols-2 lg:grid-cols-3", className)}>
      <UsageCard
        title="Cold Water"
        icon={Droplets}
        iconColor="text-blue-500"
        bgColor="bg-blue-500/10"
        progressColor="bg-blue-500"
        value={usage.coldWater}
        maxValue={effectiveQuotas.coldWaterMonth * 2}
        unit="m³"
        cost={usage.coldWater * effectiveRates.coldWater}
        currency={settings.currency}
        quota={effectiveQuotas.coldWaterMonth}
        onChange={handleColdWaterChange}
      />

      <UsageCard
        title="Hot Water"
        icon={Flame}
        iconColor="text-orange-500"
        bgColor="bg-orange-500/10"
        progressColor="bg-orange-500"
        value={usage.hotWater}
        maxValue={effectiveQuotas.hotWaterMonth * 2}
        unit="m³"
        cost={usage.hotWater * effectiveRates.hotWaterHeating}
        currency={settings.currency}
        quota={effectiveQuotas.hotWaterMonth}
        onChange={handleHotWaterChange}
      />

      <UsageCard
        title="Heating"
        icon={Thermometer}
        iconColor="text-red-500"
        bgColor="bg-red-500/10"
        progressColor="bg-red-500"
        value={usage.heating}
        maxValue={effectiveQuotas.heatMonth * 3}
        unit="GJ"
        cost={usage.heating * effectiveRates.centralHeatingVariable}
        currency={settings.currency}
        quota={effectiveQuotas.heatMonth}
        onChange={handleHeatingChange}
        step={0.01}
      />
    </div>
  );
}
