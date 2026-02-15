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
      color: "bg-blue-500",
      width: "100%",
      conversion: null,
    },
    {
      label: t("applications"),
      count: applications,
      icon: FileText,
      color: "bg-purple-500",
      width: leads > 0 ? `${(applications / leads) * 100}%` : "0%",
      conversion: `${leadsToApps}%`,
    },
    {
      label: t("accepted"),
      count: accepted,
      icon: CheckCircle,
      color: "bg-green-500",
      width: leads > 0 ? `${(accepted / leads) * 100}%` : "0%",
      conversion: `${appsToAccepted}%`,
    },
    {
      label: t("enrolled"),
      count: enrolled,
      icon: GraduationCap,
      color: "bg-teal-500",
      width: leads > 0 ? `${(enrolled / leads) * 100}%` : "0%",
      conversion: `${acceptedToEnrolled}%`,
    },
  ];

  const hasData = leads > 0 || applications > 0 || accepted > 0 || enrolled > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
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

      {/* Funnel Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const widthPercent = parseFloat(stage.width);
          const minWidth =
            widthPercent < 20 && widthPercent > 0 ? 20 : widthPercent;

          return (
            <div key={stage.label} className="relative">
              {/* Stage Bar */}
              <div
                className={`${stage.color} rounded-lg p-4 transition-all duration-300 hover:shadow-md`}
                style={{
                  width: `${minWidth}%`,
                  minWidth: stage.count > 0 ? "120px" : "0px",
                }}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{stage.label}</span>
                  </div>
                  <span className="text-lg font-bold">{stage.count}</span>
                </div>
              </div>

              {/* Conversion Arrow & Percentage */}
              {index < stages.length - 1 && stage.conversion && (
                <div className="flex items-center gap-2 mt-1 ml-4">
                  <div className="text-xs text-gray-500">↓</div>
                  <div className="text-xs font-medium text-gray-600">
                    {stage.conversion} {t("conversion")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
