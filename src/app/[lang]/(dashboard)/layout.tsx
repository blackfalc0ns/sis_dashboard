import SideBarTopNav from "@/components/layout/SideBarTopNav";
import "@/app/globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SideBarTopNav>{children}</SideBarTopNav>;
}
