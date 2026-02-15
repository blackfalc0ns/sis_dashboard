"use client";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1">
        <SchoolDashboard />
      </main>
    </div>
  );
}
