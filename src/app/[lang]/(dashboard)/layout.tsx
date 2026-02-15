import SideBarTopNav from "@/components/layout/SideBarTopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SideBarTopNav>{children}</SideBarTopNav>;
}
