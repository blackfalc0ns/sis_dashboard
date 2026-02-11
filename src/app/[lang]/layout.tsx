import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Montserrat } from "next/font/google";
import "../globals.css";

import SideBarTopNav from "@/components/layout/SideBarTopNav";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "معزز",
  description: "School Management System",
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
      <body className={`${montserrat.variable} antialiased`}>
        <NextIntlClientProvider locale={lang} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
