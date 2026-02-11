// FILE: src/components/admissions/charts/AdmissionsFunnelChart.tsx

"use client";

import { TrendingDown } from "lucide-react";

interface AdmissionsFunnelChartProps {
  data: {
    applications: number;
    interviewed: number;
    accepted: number;
    enrolled: number;
  };
  conversion: {
    interviewRate: number;
    acceptanceRate: number;
    enrollmentRate: number;
  };
}

export default function AdmissionsFunnelChart({
  data,
  conversion,
}: AdmissionsFunnelChartProps) {
  const stages = [
    {
      label: "Applications",
      count: data.applications,
      percentage: 100,
      color: "bg-blue-500",
    },
    {
      label: "Interviewed",
      count: data.interviewed,
      percentage: conversion.interviewRate,
      color: "bg-purple-500",
    },
    {
      label: "Accepted",
      count: data.accepted,
      percentage: conversion.acceptanceRate,
      color: "bg-green-500",
    },
    {
      label: "Enrolled",
      count: data.enrolled,
      percentage: conversion.enrollmentRate,
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Admissions Funnel</h3>
        <p className="text-sm text-gray-500">
          Conversion through admission stages
        </p>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = Math.max(stage.percentage, 10); // Minimum 10% width for visibility
          const nextStage = stages[index + 1];
          const conversionRate = nextStage
            ? ((nextStage.count / stage.count) * 100).toFixed(1)
            : null;

          return (
            <div key={stage.label}>
              {/* Stage Bar */}
              <div className="relative">
                <div
                  className={`${stage.color} rounded-lg p-4 transition-all duration-300 hover:shadow-md`}
                  style={{ width: `${width}%` }}
                >
                  <div className="flex items-center justify-between text-white">
                    <span className="font-semibold text-sm">{stage.label}</span>
                    <span className="font-bold text-lg">{stage.count}</span>
                  </div>
                </div>
              </div>

              {/* Conversion Arrow */}
              {conversionRate && (
                <div className="flex items-center gap-2 my-2 ml-4">
                  <TrendingDown className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {conversionRate}% conversion
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Interview Rate</p>
            <p className="text-lg font-bold text-gray-900">
              {conversion.interviewRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Acceptance Rate</p>
            <p className="text-lg font-bold text-gray-900">
              {conversion.acceptanceRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Enrollment Rate</p>
            <p className="text-lg font-bold text-gray-900">
              {conversion.enrollmentRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
