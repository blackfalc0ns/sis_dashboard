"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { CheckCircleIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";

type StatType = "positive" | "negative";
type Period = "today" | "this_week" | "this_term";

interface StatCardProps {
  labelKey: StatType;
  value: string;
  change: string;
  isPositive: boolean;
}

const StatCard = ({ labelKey, value, change, isPositive }: StatCardProps) => {
  const t = useTranslations("charts");

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex-1">
      <p className="text-gray-400 text-xs font-medium uppercase mb-2">
        {t(labelKey)}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? "positive-tag" : "negative-tag"
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
};

export default function AcademicPerformanceCard() {
  const t = useTranslations("charts");

  const [period, setPeriod] = useState<Period>("today");
  const [open, setOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        open &&
        menuRef.current &&
        btnRef.current &&
        !menuRef.current.contains(target) &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const chartData = useMemo(() => {
    // مثال: غيّر الداتا حسب الفترة (بدّلها ببياناتك الحقيقية)
    if (period === "today")
      return [1, 4, 2, 5, 7, 2, 4, 6, 8, 9, 1, 7, 12, 5, 3, 8];
    if (period === "this_week")
      return [2, 3, 4, 3, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10];
    return [3, 2, 5, 4, 6, 8, 7, 9, 10, 8, 7, 11, 12, 10, 9, 13]; // term
  }, [period]);

  const periodOptions: { key: Period }[] = [
    { key: "today" },
    { key: "this_week" },
    { key: "this_term" },
  ];

  return (
    <div className="bg-white p-6 w-full shadow-(--main-box-shadow) rounded-[16px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("academic_performance")}
          </h2>

          <div className="flex items-center gap-1.5 positive-tag px-3 py-1 rounded-full">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-sm font-bold">{t("good")}</span>
          </div>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="text-sm font-medium">{t(`period.${period}`)}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {open && (
            <div
              ref={menuRef}
              role="menu"
              className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-50"
            >
              {periodOptions.map((opt) => (
                <button
                  key={opt.key}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setPeriod(opt.key);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    period === opt.key
                      ? "text-gray-900 font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  {t(`period.${opt.key}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex gap-4 mb-6">
        <StatCard labelKey="positive" value="93%" change="+10.45%" isPositive />
        <StatCard
          labelKey="negative"
          value="7%"
          change="-4.75%"
          isPositive={false}
        />
      </div>

      {/* Chart */}
      <div className="w-full">
        <SparkLineChart
          data={chartData}
          height={180}
          color={"#036b80"}
          curve="natural"
          showTooltip
          showHighlight
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          slotProps={{
            line: {
              filter: "url(#lineShadow)",
              stroke: "url(#lineGradient)",
            },
          }}
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2.5,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            },
          }}
        >
          <defs>
            <filter
              id="lineShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="4"
                floodColor="#036b80"
                floodOpacity="0.2"
              />
            </filter>

            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0" y2="0">
              <stop offset="0%" stopColor="#036b80" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#036b80" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#036b80" stopOpacity="1" />
            </linearGradient>
          </defs>
        </SparkLineChart>
      </div>
    </div>
  );
}
