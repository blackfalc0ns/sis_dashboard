// FILE: src/components/admissions/charts/ConversionFunnelChart.tsx

"use client";

import { Users, FileText, CheckCircle, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";

interface FunnelData {
  leads: number;
  applications: number;
  accepted: number;
  enrolled: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData;
}

export default function ConversionFunnelChart({
  data,
}: ConversionFunnelChartProps) {
  const t = useTranslations("admissions.charts");
  const { leads, applications, accepted, enrolled } = data;

  // Calculate conversion percentages
  const leadsToApps =
    leads > 0 ? ((applications / leads) * 100).toFixed(1) : "0.0";
  const appsToAccepted =
    applications > 0 ? ((accepted / applications) * 100).toFixed(1) : "0.0";
  const acceptedToEnrolled =
    accepted > 0 ? ((enrolled / accepted) * 100).toFixed(1) : "0.0";
  const overallConversion =
    leads > 0 ? ((enrolled / leads) * 100).toFixed(1) : "0.0";

  const stages = [
    {
      label: t("leads"),
      count: leads,
      icon: Users,
      color: "#6366f1", // Indigo
      conversion: null,
    },
    {
      label: t("applications"),
      count: applications,
      icon: FileText,
      color: "#8b5cf6", // Purple
      conversion: `${leadsToApps}%`,
    },
    {
      label: t("accepted"),
      count: accepted,
      icon: CheckCircle,
      color: "#10b981", // Green
      conversion: `${appsToAccepted}%`,
    },
    {
      label: t("enrolled"),
      count: enrolled,
      icon: GraduationCap,
      color: "#14b8a6", // Teal
      conversion: `${acceptedToEnrolled}%`,
    },
  ];

  const hasData = leads > 0 || applications > 0 || accepted > 0 || enrolled > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-(--main-box-shadow)">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {t("conversion_funnel")}
          </h3>
          <p className="text-sm text-gray-500">{t("pipeline_stages")}</p>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </div>
    );
  }

  // Calculate widths for pyramid effect
  const maxValue = Math.max(leads, applications, accepted, enrolled);
  const getWidth = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-(--main-box-shadow) h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {t("conversion_funnel")}
        </h3>
        <p className="text-sm text-gray-500">{t("pipeline_stages")}</p>
      </div>

      {/* Overall Conversion */}
      <div className="mb-6 p-4 bg-linear-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t("overall_conversion_rate")}
          </span>
          <span className="text-2xl font-bold text-[#036b80]">
            {overallConversion}%
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {t("enrolled_out_of_leads", { enrolled, leads })}
        </p>
      </div>

      {/* Pyramid Funnel */}
      <div className="relative flex flex-col items-center py-4">
        <svg
          viewBox="0 0 400 400"
          className="w-full max-w-md"
          style={{ maxHeight: "400px" }}
        >
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const width = getWidth(stage.count);
            const topWidth = width;
            const bottomWidth =
              index < stages.length - 1
                ? getWidth(stages[index + 1].count)
                : width * 0.6;

            // Calculate trapezoid points with more height
            const centerX = 200;
            const y = index * 85 + 10;
            const height = 75;

            const topLeft = centerX - topWidth * 1.8;
            const topRight = centerX + topWidth * 1.8;
            const bottomLeft = centerX - bottomWidth * 1.8;
            const bottomRight = centerX + bottomWidth * 1.8;

            const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + height} ${bottomLeft},${y + height}`;

            return (
              <g key={stage.label}>
                {/* Trapezoid shape */}
                <polygon
                  points={points}
                  fill={stage.color}
                  className="transition-all duration-300 hover:opacity-90"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                />

                {/* Stage label */}
                <text
                  x={centerX}
                  y={y + height / 2 - 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-semibold"
                  style={{ fontSize: "15px" }}
                >
                  {stage.label}
                </text>

                {/* Stage count */}
                <text
                  x={centerX}
                  y={y + height / 2 + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-bold"
                  style={{ fontSize: "22px" }}
                >
                  {stage.count}
                </text>

                {/* Conversion percentage between stages */}
                {index < stages.length - 1 && stage.conversion && (
                  <text
                    x={centerX}
                    y={y + height + 18}
                    textAnchor="middle"
                    className="fill-gray-600 text-xs font-medium"
                    style={{ fontSize: "12px" }}
                  >
                    ↓ {stage.conversion}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">{t("leads_to_apps")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {leadsToApps}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("apps_to_accepted")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {appsToAccepted}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("accepted_to_enrolled")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {acceptedToEnrolled}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
