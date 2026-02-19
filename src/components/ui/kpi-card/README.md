# KPI Card Components

This directory contains reusable KPI card components with chart visualizations.

## Components

### 1. MonthlyUsersCard

A self-contained KPI card showing monthly users with a line chart.

**Usage:**

```tsx
import { MonthlyUsersCard } from "@/components/ui/kpi-card";

export default function Dashboard() {
  return <MonthlyUsersCard />;
}
```

### 2. KPICardWithChart (Reusable)

A flexible KPI card component that accepts custom data and configuration.

**Props:**

- `title` (string): Card title (e.g., "Monthly users")
- `currentValue` (number): Current metric value
- `currentMonth` (string): Current period label (e.g., "Jul 23")
- `previousValue` (number): Previous period value for comparison
- `data` (DataPoint[]): Array of data points for the chart
- `valuePrefix` (string, optional): Prefix for values (e.g., "$")
- `valueSuffix` (string, optional): Suffix for values (e.g., "K")
- `highlightIndex` (number, optional): Index of data point to highlight

**Usage:**

```tsx
import { KPICardWithChart } from "@/components/ui/kpi-card";

const monthlyData = [
  { month: "Jan 23", value: 234 },
  { month: "Feb 23", value: 431 },
  { month: "Mar 23", value: 543 },
  { month: "Apr 23", value: 489 },
  { month: "May 23", value: 391 },
  { month: "Jun 23", value: 582 },
  { month: "Jul 23", value: 482 },
  { month: "Aug 23", value: 389 },
  { month: "Sep 23", value: 521 },
  { month: "Oct 23", value: 434 },
  { month: "Nov 23", value: 332 },
  { month: "Dec 23", value: 275 },
];

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Users Card */}
      <KPICardWithChart
        title="Monthly users"
        currentValue={482}
        currentMonth="Jul 23"
        previousValue={582}
        data={monthlyData}
        highlightIndex={6}
      />

      {/* Revenue Card */}
      <KPICardWithChart
        title="Monthly revenue"
        currentValue={5990}
        currentMonth="Jul 23"
        previousValue={4702}
        data={monthlyData.map((d) => ({ ...d, value: d.value * 10 }))}
        valuePrefix="$"
        highlightIndex={6}
      />

      {/* Sessions Card */}
      <KPICardWithChart
        title="Monthly sessions"
        currentValue={673}
        currentMonth="Jul 23"
        previousValue={786}
        data={monthlyData.map((d) => ({ ...d, value: d.value * 2 }))}
        valueSuffix="K"
        highlightIndex={6}
      />
    </div>
  );
}
```

## Features

- ✅ Fully responsive design
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ Recharts integration
- ✅ Smooth area chart with gradient
- ✅ Automatic percentage and absolute change calculation
- ✅ Color-coded positive (green) / negative (red) changes
- ✅ Custom active dot with white border
- ✅ Clean, modern dashboard aesthetic
- ✅ No external UI libraries (except Recharts)

## Design Specifications

- **Card**: rounded-2xl, border, shadow-sm, p-6
- **Title**: text-sm, font-medium, text-gray-600
- **Value**: text-4xl, font-semibold, text-gray-900
- **Subtitle**: text-sm, text-gray-500
- **Change**: font-medium, text-red-500 (negative) or text-emerald-500 (positive)
- **Chart**: 120px height, monotone line, strokeWidth 2
- **Gradient**: Blue (#3b82f6) with 0.2 opacity
- **Active Dot**: Blue circle with white border (r=6, strokeWidth=3)

## Dependencies

- `recharts` - Chart library
- `tailwindcss` - Styling
- `react` - UI framework
- `next` - Framework (App Router)
