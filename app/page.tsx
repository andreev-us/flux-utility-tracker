"use client";

import { useState } from "react";
import { Header } from "@/components/flux/Header";
import { KPICard } from "@/components/flux/KPICard";
import { MonthDataEntry } from "@/components/flux/MonthDataEntry";
import { CostBreakdown } from "@/components/flux/CostBreakdown";
import { ElectricityTracker } from "@/components/flux/ElectricityTracker";
import { TrendsChart } from "@/components/flux/TrendsChart";
import { MonthSelector } from "@/components/flux/MonthSelector";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Loader2,
  Chrome,
  AlertCircle,
  Mail,
  Scale,
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    settings,
    projectedBill,
    liveBalance,
    cumulativeLiveBalance,
    fixedCosts,
    currentMonthData,
  } = useSettings();

  const { currency } = settings;
  const advancePayment = currentMonthData.advancePayment;
  const balanceTrend = liveBalance >= 0 ? "positive" : "negative";
  const cumulativeBalanceTrend = cumulativeLiveBalance >= 0 ? "positive" : "negative";

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth handlers
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (authMode === "signin") {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        }
      } else {
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess("Check your email for a confirmation link!");
          setEmail("");
          setPassword("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
    setError(null);
    setSuccess(null);
  };

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        </div>

        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-5xl grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left side - Branding & Features */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Logo */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary shadow-lg">
                  <Activity className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Flux</h1>
                  <p className="text-muted-foreground">Utility Bill Tracker</p>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground">WHAT YOU CAN DO</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    Track water, heating & electricity usage
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    Forecast your monthly utility bill
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    Sync data across all your devices
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    View historical trends and patterns
                  </li>
                </ul>
              </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="space-y-2 text-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {authMode === "signin" ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {authMode === "signin"
                      ? "Sign in to access your dashboard"
                      : "Sign up to start tracking your utilities"}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Google Sign In */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {authMode === "signin" ? "Sign in" : "Create account"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    {authMode === "signin" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={toggleAuthMode}
                          className="font-medium text-primary hover:underline"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={toggleAuthMode}
                          className="font-medium text-primary hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      </div>

      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 lg:px-8">
        {/* Hero Section with Month Selector */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Utility Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Track consumption and forecast your bill
            </p>
          </div>
          <MonthSelector />
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          <KPICard
            title="Projected Bill"
            value={formatCurrency(projectedBill, currency)}
            subtitle="Fixed + variable costs"
            icon={Calculator}
            delay={100}
          />
          <KPICard
            title="Advance Paid"
            value={formatCurrency(advancePayment, currency)}
            subtitle="Monthly prepayment"
            icon={CreditCard}
            delay={200}
          />
          <KPICard
            title="This Month"
            value={formatCurrency(Math.abs(liveBalance), currency)}
            subtitle={liveBalance >= 0 ? "Expected refund" : "Amount owed"}
            icon={liveBalance >= 0 ? TrendingUp : TrendingDown}
            trend={balanceTrend}
            delay={300}
          />
          <KPICard
            title="Live Balance"
            value={formatCurrency(Math.abs(cumulativeLiveBalance), currency)}
            subtitle={cumulativeLiveBalance >= 0 ? "Total refund due" : "Total owed"}
            icon={Scale}
            trend={cumulativeBalanceTrend}
            delay={350}
          />
          <KPICard
            title="Fixed Costs"
            value={formatCurrency(fixedCosts, currency)}
            subtitle="Base monthly charges"
            icon={Wallet}
            delay={400}
          />
        </div>

        {/* Month Data Entry - Main Input Area */}
        <section className="mb-6">
          <MonthDataEntry />
        </section>

        {/* Trends Section */}
        <section className="mb-6">
          <TrendsChart />
        </section>

        {/* Summary Section */}
        <section>
          <CostBreakdown />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-2 sm:mt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-3 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Flux</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Utility Bill Tracker</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              © {new Date().getFullYear()} Flux. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
