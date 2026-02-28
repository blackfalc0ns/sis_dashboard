import SideBarTopNav from "@/components/layout/SideBarTopNav";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { ToastProvider } from "@/components/ui/toast/Toast";
import "@/app/globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UnsavedChangesProvider>
        <NavigationGuardProvider>
          <SideBarTopNav>{children}</SideBarTopNav>
        </NavigationGuardProvider>
      </UnsavedChangesProvider>
    </ToastProvider>
  );
}
