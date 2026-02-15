import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Cairo } from "next/font/google";
import "../globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
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
      <body className={`${cairo.variable} antialiased`}>
        <NextIntlClientProvider locale={lang} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
