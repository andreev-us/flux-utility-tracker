# ⚡ Flux - Utility Bill Tracker

A sleek, dark-themed dashboard for tracking and forecasting monthly utility bills. Built with Next.js 14, TypeScript, and the "Flux Monochrome" design system.

![Flux Dashboard](https://via.placeholder.com/800x400/09090b/3b82f6?text=Flux+Dashboard)

## Features

- **Real-time Bill Calculation** - Enter meter readings and see your projected bill update instantly
- **Live Balance Tracking** - Know if you're under or over budget before settlement
- **Configurable Rates** - Update utility rates when prices change
- **Multi-currency Support** - Switch between PLN, EUR, and USD
- **Dark Mode Design** - Easy on the eyes with the Flux Monochrome theme

## Design System: Flux Monochrome

All design tokens are defined in `app/globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| Surface Dark | `#09090b` | Background |
| Surface Light | `#18181b` | Cards/Panels |
| Text Primary | `#fafafa` | Main text |
| Text Secondary | `#a1a1aa` | Muted text |
| Accent | `#3b82f6` | Electric Blue |
| Alert | `#ef4444` | Danger/Overruns |
| Success | `#22c55e` | Positive balance |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install
```

### Supabase Setup (Required for Authentication & Data Sync)

1. Create a Supabase project at [supabase.com](https://app.supabase.com)

2. Create a `.env.local` file in the project root with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

3. Get these values from your Supabase dashboard:
   - Go to **Settings** → **API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **Publishable Key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Copy **Secret Key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY`

4. Configure Supabase Authentication:
   - Go to **Authentication** → **Providers** → Enable **Email** provider
   - Go to **Authentication** → **URL Configuration**:
     - Site URL: `http://localhost:3000`
     - Redirect URLs: Add `http://localhost:3000/auth/callback`

5. Create database tables - Run this SQL in **SQL Editor**:

```sql
-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'zł',
  currency_locale TEXT DEFAULT 'pl-PL',
  rates JSONB DEFAULT '{"coldWater":14.83,"hotWaterHeating":35.15,"centralHeatingVariable":140.61,"garbageFixed":188.08,"parkingFixed":85.10,"adminFixed":332.90}',
  electricity_rates JSONB DEFAULT '{"perKwh":0.85}',
  quotas JSONB DEFAULT '{"waterMonth":4.0,"heatMonth":1.0,"electricityMonth":150}',
  default_advance_payment DECIMAL(10,2) DEFAULT 841.16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Month data table
CREATE TABLE IF NOT EXISTS month_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  cold_water DECIMAL(10,2) DEFAULT 0,
  hot_water DECIMAL(10,2) DEFAULT 0,
  heating DECIMAL(10,2) DEFAULT 0,
  electricity_kwh DECIMAL(10,2) DEFAULT 0,
  advance_payment DECIMAL(10,2) DEFAULT 841.16,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for month_data
CREATE POLICY "Users can view own month data" ON month_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own month data" ON month_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own month data" ON month_data FOR UPDATE USING (auth.uid() = user_id);
```

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
flux/
├── app/
│   ├── globals.css      # Design system (CSS variables)
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Main dashboard page
├── components/
│   ├── flux/            # Application components
│   │   ├── Header.tsx
│   │   ├── KPICard.tsx
│   │   ├── UsageTracker.tsx
│   │   ├── RateEditor.tsx
│   │   └── CostBreakdown.tsx
│   └── ui/              # Shadcn/UI primitives
├── contexts/
│   └── SettingsContext.tsx  # Global state management
├── lib/
│   └── utils.ts         # Utility functions
└── tailwind.config.ts   # Tailwind configuration
```

## Default Rates (from Invoice)

| Item | Rate | Unit |
|------|------|------|
| Cold Water | 14.83 | PLN/m³ |
| Hot Water Heating | 35.15 | PLN/m³ |
| Central Heating | 140.61 | PLN/GJ |
| Garbage | 188.08 | PLN/month |
| Parking | 85.10 | PLN/month |
| Administration | 332.90 | PLN/month |

**Total Advance Payment:** 841.16 PLN

## Customization

### Changing the Theme

Edit the CSS variables in `app/globals.css`:

```css
:root {
  --primary: 217 91% 60%;  /* Change accent color */
  --background: 240 10% 3.9%;  /* Change background */
}
```

### Adding New Rates

1. Update the `Rates` interface in `contexts/SettingsContext.tsx`
2. Add default values to `DEFAULT_RATES`
3. Update the `RateEditor` component with new fields

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI (Radix Primitives)
- **Icons:** Lucide React

## License

MIT


