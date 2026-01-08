"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Building2, 
  Car, 
  Trash2, 
  Wallet, 
  Droplets, 
  Flame, 
  Waves
} from "lucide-react";

interface CostBreakdownProps {
  className?: string;
}

interface CostItem {
  label: string;
  amount: number;
  icon: React.ElementType;
  iconColor: string;
  type: "fixed" | "variable";
}

export function CostBreakdown({ className }: CostBreakdownProps) {
  const { 
    settings, 
    currentMonthData, 
    fixedCosts, 
    variableCosts, 
    projectedBill,
    getEffectiveRates 
  } = useSettings();
  
  const { currency } = settings;
  const rates = getEffectiveRates();

  // Calculate variable costs details
  const coldWaterCost = currentMonthData.usage.coldWater * rates.coldWater;
  const hotWaterCost = currentMonthData.usage.hotWater * rates.hotWaterHeating;
  const heatingCost = currentMonthData.usage.heating * rates.centralHeatingVariable;

  const items: CostItem[] = [
    // Fixed Costs
    { 
      label: "Admin & Maintenance", 
      amount: rates.adminFixed, 
      icon: Building2, 
      iconColor: "text-muted-foreground",
      type: "fixed" 
    },
    { 
      label: "Garbage Collection", 
      amount: rates.garbageFixed, 
      icon: Trash2, 
      iconColor: "text-muted-foreground",
      type: "fixed" 
    },
    { 
      label: "Parking Space", 
      amount: rates.parkingFixed, 
      icon: Car, 
      iconColor: "text-muted-foreground",
      type: "fixed" 
    },
    // Variable Costs
    { 
      label: "Cold Water", 
      amount: coldWaterCost, 
      icon: Droplets, 
      iconColor: "text-muted-foreground",
      type: "variable" 
    },
    { 
      label: "Hot Water", 
      amount: hotWaterCost, 
      icon: Waves, 
      iconColor: "text-muted-foreground",
      type: "variable" 
    },
    { 
      label: "Central Heating", 
      amount: heatingCost, 
      icon: Flame, 
      iconColor: "text-muted-foreground",
      type: "variable" 
    },
  ].sort((a, b) => b.amount - a.amount);

  const fixedPercent = projectedBill > 0 ? (fixedCosts / projectedBill) * 100 : 0;
  const variablePercent = projectedBill > 0 ? (variableCosts / projectedBill) * 100 : 0;

  return (
    <Card className={cn("border bg-card card-shadow flex flex-col", className)}>
      <CardContent className="p-4 space-y-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Cost Breakdown</span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-lg">
            Estimated
          </span>
        </div>

        {/* Total Amount */}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold tabular-nums">
              {formatCurrency(projectedBill, currency)}
            </span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">
                Fixed: {formatCurrency(fixedCosts, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/40" />
              <span className="text-[10px] text-muted-foreground">
                Variable: {formatCurrency(variableCosts, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="h-2 overflow-hidden rounded-full bg-secondary flex w-full">
          <div
            className="bg-primary transition-all duration-500"
            style={{ width: `${fixedPercent}%` }}
          />
          <div
            className="bg-primary/40 transition-all duration-500"
            style={{ width: `${variablePercent}%` }}
          />
        </div>

        {/* Detailed List - Minimal icons, no colored backgrounds */}
        <div className="space-y-1 pt-1">
          {items.map((item) => (
            <div 
              key={item.label} 
              className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", item.iconColor)} />
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-none">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                    {item.type}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium tabular-nums">
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
