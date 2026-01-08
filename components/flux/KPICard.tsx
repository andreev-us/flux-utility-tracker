"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  delay = 0,
  className,
  children,
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "border bg-card card-shadow animate-slide-up opacity-0",
        className
      )}
      style={{
        animationFillMode: "forwards",
        animationDelay: `${delay}ms`,
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            {children ? (
              children
            ) : (
              <p
                className={cn(
                  "text-lg sm:text-xl font-bold tracking-tight truncate tabular-nums",
                  trend === "positive" && "text-success",
                  trend === "negative" && "text-destructive"
                )}
              >
                {value}
              </p>
            )}
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-lg p-1.5 shrink-0",
              trend === "positive" && "bg-success/10",
              trend === "negative" && "bg-destructive/10",
              trend === "neutral" && "bg-primary/10"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                trend === "positive" && "text-success",
                trend === "negative" && "text-destructive",
                trend === "neutral" && "text-primary"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
