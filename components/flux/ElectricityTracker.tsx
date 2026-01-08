"use client";

import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElectricityTrackerProps {
  className?: string;
}

export function ElectricityTracker({ className }: ElectricityTrackerProps) {
  const { 
    settings, 
    currentMonthData, 
    updateElectricityUsage, 
    electricityCost,
    getTrendData,
    getEffectiveQuotas,
    getEffectiveElectricityRate,
  } = useSettings();
  
  const kwh = currentMonthData.electricity?.kwh || 0;
  const effectiveQuotas = getEffectiveQuotas();
  const quota = effectiveQuotas.electricityMonth;
  const percent = Math.min((kwh / quota) * 100, 100);
  const isOverQuota = kwh > quota;
  const rate = getEffectiveElectricityRate();

  // Get previous month's electricity for comparison
  const trendData = getTrendData(2);
  const prevMonth = trendData.length >= 2 ? trendData[0] : null;
  const change = prevMonth && prevMonth.electricity > 0 
    ? ((kwh - prevMonth.electricity) / prevMonth.electricity) * 100 
    : null;

  const handleChange = useCallback(
    (value: number) => updateElectricityUsage(value),
    [updateElectricityUsage]
  );

  return (
    <Card className={cn("border bg-card card-shadow flex flex-col", className)}>
      <CardContent className="p-4 space-y-3 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-yellow-500/10 p-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="font-medium text-sm">Electricity</span>
          </div>
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-lg">
            Separate
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{formatNumber(kwh, 0)}</span>
              <span className="text-xs text-muted-foreground">kWh</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              @ {formatCurrency(rate, settings.currency)}/kWh
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500">
              {formatCurrency(electricityCost, settings.currency)}
            </p>
            {change !== null && (
              <p className={cn(
                "text-[10px] flex items-center justify-end gap-0.5",
                change < 0 ? "text-success" : "text-destructive"
              )}>
                {change < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {Math.abs(change).toFixed(0)}% vs prev
              </p>
            )}
          </div>
        </div>

        {/* Slider + Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Slider
              value={[kwh]}
              onValueChange={([v]) => handleChange(v)}
              max={quota * 2}
              step={1}
              className="py-1"
            />
          </div>
          <Input
            type="number"
            value={kwh}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            step={1}
            min={0}
            className="h-8 w-20 font-mono text-center text-sm"
          />
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <Progress
            value={percent}
            className="h-1.5"
            indicatorClassName={cn(
              "bg-yellow-500",
              isOverQuota && "bg-destructive"
            )}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(percent)}% of {formatNumber(quota, 0)} kWh</span>
            <span className={cn(isOverQuota && "text-destructive font-medium")}>
              {isOverQuota ? "Over estimate" : "Within estimate"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
