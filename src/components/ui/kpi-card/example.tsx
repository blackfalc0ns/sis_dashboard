// Example usage of KPI Card components
// This file is for reference only - not used in production

import { MonthlyUsersCard, KPICardWithChart } from "@/components/ui/kpi-card";

// Sample data
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

const revenueData = [
  { month: "Jan 23", value: 2340 },
  { month: "Feb 23", value: 3110 },
  { month: "Mar 23", value: 4643 },
  { month: "Apr 23", value: 4650 },
  { month: "May 23", value: 3980 },
  { month: "Jun 23", value: 4702 },
  { month: "Jul 23", value: 5990 },
  { month: "Aug 23", value: 5700 },
  { month: "Sep 23", value: 4250 },
  { month: "Oct 23", value: 4182 },
  { month: "Nov 23", value: 3812 },
  { month: "Dec 23", value: 4900 },
];

const sessionsData = [
  { month: "Jan 23", value: 1432 },
  { month: "Feb 23", value: 1032 },
  { month: "Mar 23", value: 1089 },
  { month: "Apr 23", value: 988 },
  { month: "May 23", value: 642 },
  { month: "Jun 23", value: 786 },
  { month: "Jul 23", value: 673 },
  { month: "Aug 23", value: 761 },
  { month: "Sep 23", value: 793 },
  { month: "Oct 23", value: 543 },
  { month: "Nov 23", value: 678 },
  { month: "Dec 23", value: 873 },
];

export default function KPICardsExample() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        KPI Cards Example
      </h1>

      {/* Example 1: Self-contained MonthlyUsersCard */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Example 1: MonthlyUsersCard (Self-contained)
        </h2>
        <div className="max-w-md">
          <MonthlyUsersCard />
        </div>
      </section>

      {/* Example 2: Grid of KPICardWithChart components */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Example 2: KPICardWithChart (Reusable with custom data)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <KPICardWithChart
            title="Monthly users"
            currentValue={482}
            currentMonth="Jul 23"
            previousValue={582}
            data={monthlyData}
          />

          {/* Revenue Card */}
          <KPICardWithChart
            title="Monthly revenue"
            currentValue={5990}
            currentMonth="Jul 23"
            previousValue={4702}
            data={revenueData}
            valuePrefix="$"
          />

          {/* Sessions Card */}
          <KPICardWithChart
            title="Monthly sessions"
            currentValue={673}
            currentMonth="Jul 23"
            previousValue={786}
            data={sessionsData}
          />
        </div>
      </section>

      {/* Example 3: Different time periods */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Example 3: Different metrics and periods
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive change example */}
          <KPICardWithChart
            title="New signups"
            currentValue={543}
            currentMonth="Mar 23"
            previousValue={431}
            data={monthlyData}
          />

          {/* With suffix example */}
          <KPICardWithChart
            title="Active users"
            currentValue={521}
            currentMonth="Sep 23"
            previousValue={389}
            data={monthlyData}
            valueSuffix="K"
          />
        </div>
      </section>
    </div>
  );
}
