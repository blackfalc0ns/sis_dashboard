import SideBarTopNav from "@/components/layout/SideBarTopNav";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { ProgressBarProvider } from "@/providers/ProgressBarProvider";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { OnboardingRedirectGuard } from "@/features/onboarding/components/OnboardingRedirectGuard";
import { AuthReadyGate } from "@/features/auth/components/AuthReadyGate";
import { SetupStatusProvider } from "@/features/onboarding/context/SetupStatusContext";

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
            <AuthReadyGate>
              <SetupStatusProvider>
                <OnboardingRedirectGuard>
                  <SideBarTopNav>{children}</SideBarTopNav>
                </OnboardingRedirectGuard>
              </SetupStatusProvider>
            </AuthReadyGate>
          </ProgressBarProvider>
        </NavigationGuardProvider>
      </UnsavedChangesProvider>
    </ToastProvider>
  );
}
