import { ToastProvider } from "@/components/ui/toast/Toast";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <main aria-label="Onboarding setup" className="min-h-screen bg-gray-50">
        {children}
      </main>
    </ToastProvider>
  );
}
