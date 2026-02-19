"use client";

import { AreaChart, Area, XAxis, ResponsiveContainer, Dot } from "recharts";

interface DataPoint {
  month: string;
  value: number;
}

interface KPICardWithChartProps {
  title: string;
  currentValue: number;
  currentMonth: string;
  previousValue: number;
  data: DataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  highlightIndex?: number;
}

// Custom active dot component with value label
const CustomActiveDot = (props: any) => {
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
    </g>
  );
};

export default function KPICardWithChart({
  title,
  currentValue,
  currentMonth,
  previousValue,
  data,
  valuePrefix = "",
  valueSuffix = "",
  highlightIndex,
}: KPICardWithChartProps) {
  // Calculate change
  const absoluteChange = currentValue - previousValue;
  const percentageChange = ((absoluteChange / previousValue) * 100).toFixed(1);
  const isPositive = absoluteChange >= 0;

  // Format the change value
  const formattedChange = valuePrefix
    ? `${isPositive ? "+" : ""}${valuePrefix}${Math.abs(absoluteChange)}`
    : `${isPositive ? "+" : ""}${Math.abs(absoluteChange)}${valueSuffix}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl font-semibold text-gray-900">
              {valuePrefix}
              {currentValue.toLocaleString()}
              {valueSuffix}
            </p>
            <p className="text-sm text-gray-500 mt-1">On {currentMonth}</p>
          </div>

          <div className="text-right">
            <p
              className={`font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}
            >
              {isPositive ? "+" : ""}
              {percentageChange}% ({formattedChange})
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[120px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id={`colorValue-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#036b80", fontSize: 12 }}
              ticks={[data[0]?.month, data[data.length - 1]?.month]}
              interval="preserveStartEnd"
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#036b80"
              strokeWidth={2}
              fill={`url(#colorValue-${title})`}
              activeDot={
                highlightIndex !== undefined ? <CustomActiveDot /> : false
              }
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
