"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Droplets, Flame, Zap, Receipt, BarChart3 } from "lucide-react";

type Period = 3 | 6 | 12;
type ChartType = "bill" | "water" | "electricity" | "heating";

interface TrendsChartProps {
  className?: string;
}

const CHART_CONFIG: Record<ChartType, { 
  label: string; 
  shortLabel: string;
  color: string; 
  bgColor: string;
  icon: React.ElementType;
  unit: string;
  getValue: (d: ReturnType<ReturnType<typeof useSettings>["getTrendData"]>[0]) => number;
}> = {
  bill: {
    label: "Monthly Bill",
    shortLabel: "Bill",
    color: "#6366f1",
    bgColor: "bg-indigo-500/10",
    icon: Receipt,
    unit: "",
    getValue: (d) => d.projectedBill,
  },
  water: {
    label: "Water Usage",
    shortLabel: "Water",
    color: "#0ea5e9",
    bgColor: "bg-sky-500/10",
    icon: Droplets,
    unit: "m³",
    getValue: (d) => d.totalWater,
  },
  electricity: {
    label: "Electricity",
    shortLabel: "Electric",
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    icon: Zap,
    unit: "kWh",
    getValue: (d) => d.electricity,
  },
  heating: {
    label: "Heating",
    shortLabel: "Heat",
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    icon: Flame,
    unit: "GJ",
    getValue: (d) => d.heating,
  },
};

export function TrendsChart({ className }: TrendsChartProps) {
  const [period, setPeriod] = useState<Period>(6);
  const [chartType, setChartType] = useState<ChartType>("bill");
  const { getTrendData, settings } = useSettings();

  const data = useMemo(() => getTrendData(period), [getTrendData, period]);
  const config = CHART_CONFIG[chartType];

  if (data.length === 0) {
    return (
      <Card className={cn("border bg-card", className)}>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No historical data available</p>
          <p className="text-xs mt-1 opacity-70">Start tracking to see trends</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate values
  const values = data.map(d => config.getValue(d));
  const maxValue = Math.max(...values, 1);

  // Stats
  const current = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;
  const currentValue = config.getValue(current);
  const previousValue = previous ? config.getValue(previous) : 0;
  const changePercent = previous && previousValue > 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Format value based on chart type
  const formatValue = (v: number) => {
    if (chartType === "bill") return formatCurrency(v, settings.currency);
    if (chartType === "electricity") return `${formatNumber(v, 0)} ${config.unit}`;
    return `${formatNumber(v, 2)} ${config.unit}`;
  };

  return (
    <Card className={cn("border bg-card overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm sm:text-base">Usage Trends</h3>
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {([3, 6, 12] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                    period === p 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}M
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type Tabs */}
          <div className="flex gap-1.5 p-1 rounded-lg bg-muted/40 backdrop-blur-sm">
            {(Object.keys(CHART_CONFIG) as ChartType[]).map((type) => {
              const TypeIcon = CHART_CONFIG[type].icon;
              const isActive = chartType === type;
              const typeConfig = CHART_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                    isActive 
                      ? "bg-primary/15 text-primary shadow-sm border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <TypeIcon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                  <span className="hidden sm:inline">{typeConfig.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 px-3 sm:px-5 pb-3 sm:pb-5">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Current</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums transition-colors duration-200" style={{ color: config.color }}>
              {formatValue(currentValue)}
            </p>
            {changePercent !== 0 && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] sm:text-xs mt-1 transition-colors duration-200",
                changePercent < 0 ? "text-success" : "text-muted-foreground"
              )}>
                {changePercent < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span className="font-medium">{Math.abs(changePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Average</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums">{formatValue(avgValue)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{period} months</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Peak</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums">{formatValue(maxValue)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">highest</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
