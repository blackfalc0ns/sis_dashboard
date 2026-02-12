// FILE: src/components/students-guardians/profile-tabs/GradesTab.tsx

"use client";

import { TrendingUp, Award, BookOpen, Target } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Student } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";
import DataTable from "@/components/ui/common/DataTable";

interface GradesTabProps {
  student: Student;
}

// Mock grades data
const mockSubjects = [
  {
    id: "1",
    subject: "Mathematics",
    average: 85,
    last_assessment: 88,
    assessments_count: 5,
    trend: "up",
  },
  {
    id: "2",
    subject: "Science",
    average: 90,
    last_assessment: 92,
    assessments_count: 4,
    trend: "up",
  },
  {
    id: "3",
    subject: "English",
    average: 88,
    last_assessment: 85,
    assessments_count: 6,
    trend: "down",
  },
  {
    id: "4",
    subject: "Arabic",
    average: 92,
    last_assessment: 94,
    assessments_count: 5,
    trend: "up",
  },
  {
    id: "5",
    subject: "History",
    average: 87,
    last_assessment: 87,
    assessments_count: 4,
    trend: "stable",
  },
  {
    id: "6",
    subject: "Physical Education",
    average: 95,
    last_assessment: 96,
    assessments_count: 3,
    trend: "up",
  },
];

export default function GradesTab({ student }: GradesTabProps) {
  // Mock performance over time
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const performanceData = [82, 85, 87, 86, 89, student.current_average];

  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "down")
      return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <span className="w-4 h-4 text-gray-400">-</span>;
  };

  const columns = [
    {
      key: "subject",
      label: "Subject",
    },
    {
      key: "average",
      label: "Average",
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{value as number}%</span>
      ),
    },
    {
      key: "last_assessment",
      label: "Last Assessment",
      render: (value: unknown) => `${value as number}%`,
    },
    {
      key: "assessments_count",
      label: "Assessments",
      render: (value: unknown) => `${value as number} total`,
    },
    {
      key: "trend",
      label: "Trend",
      sortable: false,
      render: (value: unknown) => (
        <div className="flex items-center justify-center">
          {getTrendIcon(value as string)}
        </div>
      ),
    },
  ];

  const highestGrade = Math.max(...mockSubjects.map((s) => s.average));
  const lowestGrade = Math.min(...mockSubjects.map((s) => s.average));
  const totalAssessments = mockSubjects.reduce(
    (sum, s) => sum + s.assessments_count,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Average"
          value={`${student.current_average}%`}
          icon={Award}
          numbers="Overall GPA"
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title="Highest Grade"
          value={`${highestGrade}%`}
          icon={Target}
          numbers="Physical Education"
          iconBgColor="bg-green-500"
        />
        <KPICard
          title="Lowest Grade"
          value={`${lowestGrade}%`}
          icon={BookOpen}
          numbers="Mathematics"
          iconBgColor="bg-orange-500"
        />
        <KPICard
          title="Total Assessments"
          value={totalAssessments}
          icon={TrendingUp}
          numbers="This semester"
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Performance Over Time */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Performance Over Time
        </h3>
        <div className="h-80">
          <LineChart
            xAxis={[{ scaleType: "point", data: months }]}
            series={[
              {
                data: performanceData,
                label: "Average Grade",
                color: "#036b80",
                curve: "linear",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          />
        </div>
      </div>

      {/* Subject Grades */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Subject Grades</h3>
          <p className="text-sm text-gray-500 mt-1">
            View-only grade information
          </p>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={mockSubjects}
            showPagination={false}
          />
        </div>
      </div>

      {/* Subject Performance Bars */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Subject Performance
        </h3>
        <div className="space-y-4">
          {mockSubjects.map((subject) => (
            <div key={subject.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {subject.subject}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {subject.average}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    subject.average >= 90
                      ? "bg-green-500"
                      : subject.average >= 80
                        ? "bg-blue-500"
                        : subject.average >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                  }`}
                  style={{ width: `${subject.average}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
