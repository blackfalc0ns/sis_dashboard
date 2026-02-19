"use client";

import { ChartCard } from "./index";
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

// Sample data
const areaChartData = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 300 },
  { month: "Mar", value: 600 },
  { month: "Apr", value: 800 },
  { month: "May", value: 500 },
  { month: "Jun", value: 700 },
];

const barChartData = [
  { name: "Grade 1", students: 45 },
  { name: "Grade 2", students: 52 },
  { name: "Grade 3", students: 48 },
  { name: "Grade 4", students: 61 },
  { name: "Grade 5", students: 55 },
  { name: "Grade 6", students: 49 },
];

const lineChartData = [
  { day: "Mon", attendance: 95 },
  { day: "Tue", attendance: 92 },
  { day: "Wed", attendance: 94 },
  { day: "Thu", attendance: 91 },
  { day: "Fri", attendance: 93 },
  { day: "Sat", attendance: 89 },
];

export default function ChartCardExamples() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Chart Card Examples</h1>

      {/* Example 1: Area Chart */}
      <ChartCard
        title="Revenue Overview"
        subtitle="Total revenue from all sources"
        description="This chart shows the total revenue generated over the selected time period. The data is updated daily and includes all payment methods."
        onPeriodChange={(period) => console.log("Period changed to:", period)}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Example 2: Bar Chart */}
      <ChartCard
        title="Students Per Grade"
        subtitle="Current academic year distribution"
        description="Distribution of students across different grade levels. This helps identify which grades need more resources or attention."
        onPeriodChange={(period) => console.log("Period changed to:", period)}
        defaultPeriod="1y"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Bar dataKey="students" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Example 3: Line Chart */}
      <ChartCard
        title="Weekly Attendance Rate"
        subtitle="Monday to Saturday tracking"
        description="Track daily attendance rates throughout the week. Green indicates above 90% attendance, which is our target threshold."
        onPeriodChange={(period) => console.log("Period changed to:", period)}
        defaultPeriod="7d"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Example 4: Without Period Filter */}
      <ChartCard
        title="Static Chart"
        description="This is a static chart without a period filter. Useful for charts that don't need time-based filtering."
        showPeriodFilter={false}
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Your chart content goes here</p>
        </div>
      </ChartCard>

      {/* Example 5: Without Description */}
      <ChartCard
        title="Simple Chart"
        showPeriodFilter={true}
        onPeriodChange={(period) => console.log("Period changed to:", period)}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData}>
              <defs>
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorValue2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Example 6: Custom Styling */}
      <ChartCard
        title="Custom Styled Chart"
        description="You can add custom classes to style the card differently."
        className="border-2 border-blue-200 shadow-lg"
        onPeriodChange={(period) => console.log("Period changed to:", period)}
      >
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <p className="text-gray-600 font-medium">Custom styled content</p>
        </div>
      </ChartCard>
    </div>
  );
}
