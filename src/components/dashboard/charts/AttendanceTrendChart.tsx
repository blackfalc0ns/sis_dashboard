"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Period = "days_30" | "week" | "term";

export default function AttendanceTrendChart() {
  const t = useTranslations("attendance_trend");

  const [period, setPeriod] = useState<Period>("days_30");
  const [open, setOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const { days, attendanceData, average, belowDays } = useMemo(() => {
    // استبدل الداتا دي ببياناتك الحقيقية
    if (period === "week") {
      const d = Array.from({ length: 7 }, (_, i) => i + 1);
      const data = [92, 94, 91, 95, 93, 96, 94];
      const avg = 94;
      const below = 1;
      return { days: d, attendanceData: data, average: avg, belowDays: below };
    }

    if (period === "term") {
      const d = Array.from({ length: 12 }, (_, i) => i + 1); // مثال: 12 أسبوع
      const data = [93, 92, 94, 95, 93, 94, 96, 95, 94, 93, 94, 95];
      const avg = 94;
      const below = 2;
      return { days: d, attendanceData: data, average: avg, belowDays: below };
    }

    // default 30 days
    const d = Array.from({ length: 30 }, (_, i) => i + 1);
    const data = [
      92, 94, 91, 95, 93, 96, 94, 92, 95, 94, 93, 96, 95, 94, 92, 93, 95, 94,
      96, 93, 94, 95, 92, 94, 93, 95, 94, 96, 93, 94.5,
    ];
    const avg = 94;
    const below = 3;
    return { days: d, attendanceData: data, average: avg, belowDays: below };
  }, [period]);

  const avgLine = useMemo(
    () => Array(days.length).fill(average),
    [days.length, average],
  );

  const periodOptions: { key: Period }[] = [
    { key: "days_30" },
    { key: "week" },
    { key: "term" },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">
              {t("title", { period: t(`period.${period}`) })}
            </h3>

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
                <span className="text-sm font-medium">
                  {t(`period.${period}`)}
                </span>
                <span className="sr-only">{t("change_period")}</span>
                {/* ممكن تضيف ChevronIcon لو تحب */}
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

          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">{t("average_label")}</p>
          <p className="text-lg font-bold text-(--primary-color)">{average}%</p>
        </div>
      </div>

      <div className="h-48">
        <LineChart
          xAxis={[{ data: days, scaleType: "linear" }]}
          series={[
            {
              data: attendanceData,
              label: t("series.attendance"),
              color: "#036b80",
              curve: "natural",
            },
            {
              data: avgLine,
              label: t("series.average"),
              color: "#f59e0b",
              curve: "linear",
            },
          ]}
          height={180}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </div>

      {/* Action Flow */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">
              {t("below_days", { days: belowDays })}
            </span>{" "}
            {t("below_threshold_suffix")}
          </p>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-(--primary-color) text-white rounded-lg text-xs font-medium hover:bg-(--hover-color) transition-colors flex items-center gap-1">
              {t("actions.view_details")}
              <ArrowRight className="w-3 h-3" />
            </button>

            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
              {t("actions.send_alert")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
