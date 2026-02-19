"use client";

import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";

// Dummy monthly data
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

interface DataPoint {
  month: string;
  value: number;
}

interface CustomActiveDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}

// Custom active dot component with value label
const CustomActiveDot = (props: CustomActiveDotProps) => {
  const { cx, cy, payload } = props;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#036b80"
        stroke="#ffffff"
        strokeWidth={3}
      />
      {/* Value label above the dot */}
      {cy !== undefined && payload !== undefined && (
        <text
          x={cx}
          y={cy - 15}
          textAnchor="middle"
          fill="#036b80"
          fontSize="12"
          fontWeight="600"
        >
          {payload.value}
        </text>
      )}
    </g>
  );
};

export default function MonthlyUsersCard() {
  // Calculate current value and change
  const currentIndex = 6; // Jul 23
  const currentValue = monthlyData[currentIndex].value;
  const previousValue = monthlyData[currentIndex - 1].value;
  const absoluteChange = currentValue - previousValue;
  const percentageChange = ((absoluteChange / previousValue) * 100).toFixed(1);
  const currentMonth = monthlyData[currentIndex].month;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          Monthly users
        </h3>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl font-semibold text-gray-900">
              {currentValue}
            </p>
            <p className="text-sm text-gray-500 mt-1">On {currentMonth}</p>
          </div>

          <div className="text-right">
            <p className="text-red-500 font-medium">
              {percentageChange}% ({absoluteChange >= 0 ? "+" : ""}$
              {Math.abs(absoluteChange)})
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[120px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthlyData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#036b80" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#036b80" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#036b80", fontSize: 12 }}
              ticks={["Jan 23", "Dec 23"]}
              interval="preserveStartEnd"
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#036b80"
              strokeWidth={2}
              fill="url(#colorValue)"
              activeDot={<CustomActiveDot />}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
