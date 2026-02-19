"use client";

import { ChartCard, GaugeChart } from "@/components/ui/chart-card";

export default function GaugeChartExample() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Gauge Chart Examples</h1>

      {/* Example 1: Attendance */}
      <ChartCard
        title="الحضور"
        description="نسبة حضور الطلاب اليوم"
        showPeriodFilter={false}
        bgColor="#e0f2f5"
      >
        <GaugeChart
          value={75}
          presentLabel="حاضر"
          absentLabel="غائب"
          presentColor="#036b80"
          absentColor="#14b8a6"
        />
      </ChartCard>

      {/* Example 2: Academic Performance */}
      <ChartCard
        title="الأداء الأكاديمي"
        description="نسبة النجاح في الامتحانات"
        showPeriodFilter={false}
        bgColor="#dbeafe"
      >
        <GaugeChart
          value={92}
          presentLabel="ناجح"
          absentLabel="راسب"
          presentColor="#3b82f6"
          absentColor="#ef4444"
        />
      </ChartCard>

      {/* Example 3: Custom Colors */}
      <ChartCard
        title="معدل الإنجاز"
        description="نسبة إنجاز المهام المطلوبة"
        showPeriodFilter={false}
        bgColor="#d1fae5"
      >
        <GaugeChart
          value={68}
          presentLabel="مكتمل"
          absentLabel="متبقي"
          presentColor="#10b981"
          absentColor="#f59e0b"
          size={250}
          thickness={50}
        />
      </ChartCard>
    </div>
  );
}
