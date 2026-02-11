"use client";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import SideBarTopNav from "@/components/layout/SideBarTopNav";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1">
        <SideBarTopNav>
          <SchoolDashboard />
        </SideBarTopNav>
      </main>
    </div>
  );
}
