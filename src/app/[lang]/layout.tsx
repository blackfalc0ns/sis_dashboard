import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { cairo } from "@/lib/fonts";
import "../globals.css";
import Providers from "../providers";

export const metadata = {
  title: "Moazzez | معزز",
  description: "School Management System",
 
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
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
