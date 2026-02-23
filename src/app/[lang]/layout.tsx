import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { cairo } from "@/lib/fonts";
import "../globals.css";

export const metadata = {
  title: "معزز",
  description: "School Management System",
  icons: {
    icon: [
      {
        url: "/images/logo/moazzez_logo.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/images/logo/moazzez_logo.svg",
    apple: "/images/logo/moazzez_logo.svg",
  },
  themeColor: "#ffffff",
  manifest: "/manifest.json",
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!routing.locales.includes(lang as "en" | "ar")) notFound();

  const messages = (await import(`@/messages/${lang}.json`)).default;

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body className={`${cairo.variable} antialiased`}>
        <NextIntlClientProvider locale={lang} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
