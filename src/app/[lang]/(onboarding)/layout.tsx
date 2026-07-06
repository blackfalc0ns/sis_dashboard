import { ToastProvider } from "@/components/ui/toast/Toast";
import { getTranslations } from "next-intl/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("onboarding");

  return (
    <ToastProvider>
      <main aria-label={t("layout.label")} className="min-h-screen bg-gray-50">
        {children}
      </main>
    </ToastProvider>
  );
}
