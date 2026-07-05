import SideBarTopNav from "@/components/layout/SideBarTopNav";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { ProgressBarProvider } from "@/providers/ProgressBarProvider";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { OnboardingRedirectGuard } from "@/features/onboarding/components/OnboardingRedirectGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UnsavedChangesProvider>
        <NavigationGuardProvider>
          <ProgressBarProvider>
            <OnboardingRedirectGuard>
              <SideBarTopNav>{children}</SideBarTopNav>
            </OnboardingRedirectGuard>
          </ProgressBarProvider>
        </NavigationGuardProvider>
      </UnsavedChangesProvider>
    </ToastProvider>
  );
}
