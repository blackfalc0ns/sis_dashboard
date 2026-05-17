"use client";

import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/Toast";
import AnnouncementEditor from "@/features/communication/components/announcements/AnnouncementEditor";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useAnnouncements } from "@/features/communication/hooks/useAnnouncements";
import type { Announcement } from "@/features/communication/types/announcement.types";

const labels = {
  en: {
    back: "Back to announcements",
    title: "New Announcement",
    description: "Compose localized announcement content and save it as a draft.",
    formTitle: "Default title",
    titleEn: "English title",
    titleAr: "Arabic title",
    body: "Default body",
    bodyEn: "English body",
    bodyAr: "Arabic body",
    priority: "Priority",
    normal: "Normal",
    low: "Low",
    high: "High",
    urgent: "Urgent",
    targetScopeType: "Target scope type",
    targetScopeId: "Target scope ID",
    targetHelp: "Optional; use existing backend-recognized scope values.",
    saveDraft: "Save Draft",
    titleRequired: "Enter at least one title.",
    bodyRequired: "Enter at least one body.",
    created: "Announcement draft created.",
    failed: "Unable to create announcement.",
  },
  ar: {
    back: "العودة إلى الإعلانات",
    title: "إعلان جديد",
    description: "اكتب محتوى الإعلان باللغات المتاحة واحفظه كمسودة.",
    formTitle: "العنوان الافتراضي",
    titleEn: "العنوان بالإنجليزية",
    titleAr: "العنوان بالعربية",
    body: "المحتوى الافتراضي",
    bodyEn: "المحتوى بالإنجليزية",
    bodyAr: "المحتوى بالعربية",
    priority: "الأولوية",
    normal: "عادية",
    low: "منخفضة",
    high: "مرتفعة",
    urgent: "عاجلة",
    targetScopeType: "نوع نطاق الجمهور",
    targetScopeId: "معرف نطاق الجمهور",
    targetHelp: "اختياري؛ استخدم قيم النطاق المعتمدة في الخلفية.",
    saveDraft: "حفظ المسودة",
    titleRequired: "أدخل عنوانا واحدا على الأقل.",
    bodyRequired: "أدخل محتوى واحدا على الأقل.",
    created: "تم إنشاء مسودة الإعلان.",
    failed: "تعذر إنشاء الإعلان.",
  },
};

type LocaleKey = keyof typeof labels;

export default function CreateAnnouncementPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { create, isMutating } = useAnnouncements();

  const handleSubmit = async (
    values: Parameters<typeof create>[0],
  ) => {
    try {
      const announcement = (await create(values)) as Announcement | null;
      showSuccess(t.created);
      router.push(
        announcement?.id
          ? `/${locale}/communication/announcements/${announcement.id}`
          : `/${locale}/communication/announcements`,
      );
    } catch {
      showError(t.failed);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/communication/announcements`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>
      <CommunicationPageHeader title={t.title} description={t.description} />
      <CommunicationTabs />
      <AnnouncementEditor
        isSubmitting={isMutating}
        onSubmit={handleSubmit}
        labels={{
          title: t.formTitle,
          titleEn: t.titleEn,
          titleAr: t.titleAr,
          body: t.body,
          bodyEn: t.bodyEn,
          bodyAr: t.bodyAr,
          priority: t.priority,
          normal: t.normal,
          low: t.low,
          high: t.high,
          urgent: t.urgent,
          targetScopeType: t.targetScopeType,
          targetScopeId: t.targetScopeId,
          targetHelp: t.targetHelp,
          saveDraft: t.saveDraft,
          saveChanges: t.saveDraft,
          titleRequired: t.titleRequired,
          bodyRequired: t.bodyRequired,
        }}
      />
    </div>
  );
}
