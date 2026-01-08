"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSettings, type Rates, type Quotas, type MeterReadings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, RotateCcw, Save, Zap, User, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface RateEditorProps {
  className?: string;
}

const RATE_LABELS: Record<keyof Rates, { label: string; unit: string }> = {
  coldWater: { label: "Cold Water", unit: "per m³" },
  hotWaterHeating: { label: "Hot Water Heating", unit: "per m³" },
  centralHeatingVariable: { label: "Central Heating", unit: "per GJ" },
  garbageFixed: { label: "Garbage Collection", unit: "fixed/month" },
  parkingFixed: { label: "Parking", unit: "fixed/month" },
  adminFixed: { label: "Administration", unit: "fixed/month" },
};

const QUOTA_LABELS: Record<keyof Quotas, { label: string; unit: string }> = {
  coldWaterMonth: { label: "Cold Water Allowance", unit: "m³/month" },
  hotWaterMonth: { label: "Hot Water Allowance", unit: "m³/month" },
  heatMonth: { label: "Heat Allowance", unit: "GJ/month" },
  electricityMonth: { label: "Electricity Estimate", unit: "kWh/month" },
};

const METER_LABELS: Record<keyof MeterReadings, { label: string; unit: string }> = {
  coldWater: { label: "Cold Water", unit: "m³" },
  hotWater: { label: "Hot Water", unit: "m³" },
  heating: { label: "Heating", unit: "GJ" },
  electricity: { label: "Electricity", unit: "kWh" },
};

export function RateEditor({ className }: RateEditorProps) {
  const {
    settings,
    currentMonthData,
    updateCurrency,
    updateRate,
    updateElectricityRate,
    updateQuota,
    updateAdvancePayment,
    updateStartingMeterReading,
    resetToDefaults,
  } = useSettings();

  const { user, updateProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [localRates, setLocalRates] = useState(settings.rates);
  const [localQuotas, setLocalQuotas] = useState(settings.quotas);
  const [localAdvance, setLocalAdvance] = useState(currentMonthData.advancePayment);
  const [localElectricityRate, setLocalElectricityRate] = useState(settings.electricityRates.perKwh);
  const [localStartingReadings, setLocalStartingReadings] = useState(settings.startingMeterReadings);
  const [localCurrency, setLocalCurrency] = useState(
    settings.currency === "zł" ? "PLN" : settings.currency === "€" ? "EUR" : "USD"
  );

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalRates(settings.rates);
      setLocalQuotas(settings.quotas);
      setLocalAdvance(currentMonthData.advancePayment);
      setLocalElectricityRate(settings.electricityRates.perKwh);
      setLocalStartingReadings(settings.startingMeterReadings);
      setLocalCurrency(
        settings.currency === "zł" ? "PLN" : settings.currency === "€" ? "EUR" : "USD"
      );
      
      // Initialize profile fields
      if (user) {
        const metadata = user.user_metadata;
        setFirstName(metadata?.first_name || metadata?.full_name?.split(" ")[0] || "");
        setLastName(metadata?.last_name || metadata?.full_name?.split(" ").slice(1).join(" ") || "");
      }
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    // Save profile if user is logged in
    if (user && (firstName.trim() || lastName.trim())) {
      setProfileLoading(true);
      await updateProfile(firstName.trim(), lastName.trim());
      setProfileLoading(false);
    }

    updateCurrency(localCurrency);
    Object.entries(localRates).forEach(([key, value]) => {
      updateRate(key as keyof Rates, value);
    });
    Object.entries(localQuotas).forEach(([key, value]) => {
      updateQuota(key as keyof Quotas, value);
    });
    updateAdvancePayment(localAdvance);
    updateElectricityRate(localElectricityRate);
    // Save starting meter readings
    Object.entries(localStartingReadings).forEach(([key, value]) => {
      updateStartingMeterReading(key as keyof MeterReadings, value);
    });
    setOpen(false);
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalRates({
      coldWater: 0,
      hotWaterHeating: 0,
      centralHeatingVariable: 0,
      garbageFixed: 0,
      parkingFixed: 0,
      adminFixed: 0,
    });
    setLocalQuotas({ coldWaterMonth: 0, hotWaterMonth: 0, heatMonth: 0, electricityMonth: 0 });
    setLocalAdvance(0);
    setLocalElectricityRate(0);
    setLocalStartingReadings({ coldWater: 0, hotWater: 0, heating: 0, electricity: 0 });
    setLocalCurrency("PLN");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 border bg-card card-shadow transition-all hover:border-primary/50 hover:bg-primary/5",
            className
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure rates, quotas, and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {/* Profile Section - Only show when logged in */}
          {user && (
            <>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Profile
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Signed in as {user.email}
                </p>
              </div>

              <Separator />
            </>
          )}

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={localCurrency} onValueChange={setLocalCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLN">PLN (zł)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advance Payment */}
          <div className="space-y-2">
            <Label htmlFor="advance">Monthly Advance Payment</Label>
            <Input
              id="advance"
              type="number"
              value={localAdvance || ""}
              onChange={(e) => setLocalAdvance(e.target.value === "" ? 0 : parseFloat(e.target.value))}
              step={0.01}
              placeholder="0"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              This updates the advance for the currently selected month
            </p>
          </div>

          <Separator />

          {/* Variable Rates */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Variable Rates
            </h4>
            {(["coldWater", "hotWaterHeating", "centralHeatingVariable"] as const).map(
              (key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key}>{RATE_LABELS[key].label}</Label>
                    <span className="text-xs text-muted-foreground">
                      {RATE_LABELS[key].unit}
                    </span>
                  </div>
                  <Input
                    id={key}
                    type="number"
                    value={localRates[key] || ""}
                    onChange={(e) =>
                      setLocalRates((prev) => ({
                        ...prev,
                        [key]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                      }))
                    }
                    step={0.01}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
              )
            )}
          </div>

          <Separator />

          {/* Fixed Costs */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Fixed Monthly Costs
            </h4>
            {(["garbageFixed", "parkingFixed", "adminFixed"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key}>{RATE_LABELS[key].label}</Label>
                  <span className="text-xs text-muted-foreground">
                    {RATE_LABELS[key].unit}
                  </span>
                </div>
                <Input
                  id={key}
                  type="number"
                  value={localRates[key] || ""}
                  onChange={(e) =>
                    setLocalRates((prev) => ({
                      ...prev,
                      [key]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    }))
                  }
                  step={0.01}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Electricity (Separate) */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500" />
              Electricity (Separate Bill)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="electricityRate">Rate per kWh</Label>
                <span className="text-xs text-muted-foreground">per kWh</span>
              </div>
              <Input
                id="electricityRate"
                type="number"
                value={localElectricityRate || ""}
                onChange={(e) => setLocalElectricityRate(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                step={0.01}
                placeholder="0"
                className="font-mono"
              />
            </div>
          </div>

          <Separator />

          {/* Quotas */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Monthly Quotas / Estimates
            </h4>
            {(Object.keys(QUOTA_LABELS) as Array<keyof Quotas>).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key}>{QUOTA_LABELS[key].label}</Label>
                  <span className="text-xs text-muted-foreground">
                    {QUOTA_LABELS[key].unit}
                  </span>
                </div>
                <Input
                  id={key}
                  type="number"
                  value={localQuotas[key] || ""}
                  onChange={(e) =>
                    setLocalQuotas((prev) => ({
                      ...prev,
                      [key]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    }))
                  }
                  step={key === "electricityMonth" ? 1 : 0.1}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Starting Meter Readings */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Gauge className="h-4 w-4" />
              Starting Meter Readings
            </h4>
            <p className="text-xs text-muted-foreground">
              Initial meter values for calculating usage in your first month
            </p>
            {(Object.keys(METER_LABELS) as Array<keyof MeterReadings>).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`start-${key}`}>{METER_LABELS[key].label}</Label>
                  <span className="text-xs text-muted-foreground">
                    {METER_LABELS[key].unit}
                  </span>
                </div>
                <Input
                  id={`start-${key}`}
                  type="number"
                  value={localStartingReadings[key] || ""}
                  onChange={(e) =>
                    setLocalStartingReadings((prev) => ({
                      ...prev,
                      [key]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    }))
                  }
                  step={key === "electricity" ? 1 : 0.01}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={profileLoading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
