"use client";

import { useLocale } from "next-intl";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import CommunicationAdminOverviewCards from "@/features/communication/components/settings/CommunicationAdminOverviewCards";
import CommunicationPolicyForm from "@/features/communication/components/settings/CommunicationPolicyForm";
import CommunicationPolicySummary from "@/features/communication/components/settings/CommunicationPolicySummary";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import type { CommunicationPolicyFormValues } from "@/features/communication/hooks/useCommunicationPolicy";

const labels = {
  en: {
    title: "Communication Settings",
    description:
      "Manage communication policy, limits, receipts, moderation mode, and feature availability.",
    refresh: "Refresh",
    loading: "Loading communication policy...",
    errorTitle: "Unable to load communication settings",
    retry: "Retry",
    saved: "Communication policy saved.",
    saveFailed: "Unable to save communication policy.",
    overviewConversations: "Conversations",
    overviewAnnouncements: "Announcements",
    overviewUnreadNotifications: "Unread notifications",
    overviewOpenReports: "Open reports",
    overviewActiveRestrictions: "Active restrictions",
    overviewActiveBlocks: "Active blocks",
    summaryTitle: "Policy Summary",
    enabledValue: "Enabled",
    disabledValue: "Disabled",
    attachments: "Attachments",
    reactions: "Reactions",
    moderationMode: "Moderation mode",
    maxGroupMembers: "Max group members",
    maxMessageLength: "Max message length",
    maxAttachmentSize: "Max attachment size MB",
    notSet: "Not set",
    formTitle: "Policy Editor",
    save: "Save Policy",
    enabled: "Communication enabled",
    adminToAnyone: "Admins can message anyone",
    directStaffToStaff: "Staff direct messages",
    teacherCreatedGroups: "Teacher-created groups",
    messageEdit: "Message editing",
    messageDelete: "Message deletion",
    readReceipts: "Read receipts",
    deliveryReceipts: "Delivery receipts",
    maxAttachmentSizeMb: "Max attachment size MB",
    manual: "Manual",
    automatic: "Automatic",
    strict: "Strict",
    metadata: "Metadata",
    metadataHelp: "Optional JSON object for backend-supported policy metadata.",
    invalidMetadata: "Metadata must be a valid JSON object.",
  },
  ar: {
    title: "إعدادات التواصل",
    description: "أدر سياسة التواصل والحدود والإيصالات ووضع الإشراف وتوفر الميزات.",
    refresh: "تحديث",
    loading: "جار تحميل سياسة التواصل...",
    errorTitle: "تعذر تحميل إعدادات التواصل",
    retry: "إعادة المحاولة",
    saved: "تم حفظ سياسة التواصل.",
    saveFailed: "تعذر حفظ سياسة التواصل.",
    overviewConversations: "المحادثات",
    overviewAnnouncements: "الإعلانات",
    overviewUnreadNotifications: "الإشعارات غير المقروءة",
    overviewOpenReports: "البلاغات المفتوحة",
    overviewActiveRestrictions: "القيود النشطة",
    overviewActiveBlocks: "الحظر النشط",
    summaryTitle: "ملخص السياسة",
    enabledValue: "مفعل",
    disabledValue: "معطل",
    attachments: "المرفقات",
    reactions: "التفاعلات",
    moderationMode: "وضع الإشراف",
    maxGroupMembers: "الحد الأقصى لأعضاء المجموعة",
    maxMessageLength: "الحد الأقصى لطول الرسالة",
    maxAttachmentSize: "الحد الأقصى لحجم المرفق MB",
    notSet: "غير محدد",
    formTitle: "محرر السياسة",
    save: "حفظ السياسة",
    enabled: "تفعيل التواصل",
    adminToAnyone: "يمكن للمشرفين مراسلة الجميع",
    directStaffToStaff: "رسائل مباشرة بين الموظفين",
    teacherCreatedGroups: "مجموعات ينشئها المعلمون",
    messageEdit: "تعديل الرسائل",
    messageDelete: "حذف الرسائل",
    readReceipts: "إيصالات القراءة",
    deliveryReceipts: "إيصالات التسليم",
    maxAttachmentSizeMb: "الحد الأقصى لحجم المرفق MB",
    manual: "يدوي",
    automatic: "تلقائي",
    strict: "صارم",
    metadata: "البيانات الإضافية",
    metadataHelp: "كائن JSON اختياري لبيانات السياسة التي تدعمها الخلفية.",
    invalidMetadata: "يجب أن تكون البيانات الإضافية كائن JSON صالحا.",
  },
};

type LocaleKey = keyof typeof labels;

export default function CommunicationSettingsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    adminOverview,
    error,
    isLoading,
    isRefreshing,
    isSaving,
    policy,
    refresh,
    save,
  } = useCommunicationPolicy();

  const handleSave = async (values: CommunicationPolicyFormValues) => {
    try {
      await save(values);
      showSuccess(t.saved);
    } catch {
      showError(t.saveFailed);
    }
  };

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            type="button"
            variant="secondary"
            loading={isRefreshing}
            onClick={() => void refresh()}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {t.refresh}
          </Button>
        }
      />
      <CommunicationTabs />

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <CommunicationAdminOverviewCards
        overview={adminOverview}
        labels={{
          conversations: t.overviewConversations,
          announcements: t.overviewAnnouncements,
          unreadNotifications: t.overviewUnreadNotifications,
          openReports: t.overviewOpenReports,
          activeRestrictions: t.overviewActiveRestrictions,
          activeBlocks: t.overviewActiveBlocks,
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CommunicationPolicyForm
          key={policy?.updatedAt ?? policy?.id ?? "communication-policy"}
          policy={policy}
          isSaving={isSaving}
          onSubmit={handleSave}
          labels={{
            title: t.formTitle,
            save: t.save,
            enabled: t.enabled,
            adminToAnyone: t.adminToAnyone,
            directStaffToStaff: t.directStaffToStaff,
            teacherCreatedGroups: t.teacherCreatedGroups,
            attachments: t.attachments,
            reactions: t.reactions,
            messageEdit: t.messageEdit,
            messageDelete: t.messageDelete,
            readReceipts: t.readReceipts,
            deliveryReceipts: t.deliveryReceipts,
            maxGroupMembers: t.maxGroupMembers,
            maxMessageLength: t.maxMessageLength,
            maxAttachmentSizeMb: t.maxAttachmentSizeMb,
            moderationMode: t.moderationMode,
            manual: t.manual,
            automatic: t.automatic,
            strict: t.strict,
            metadata: t.metadata,
            metadataHelp: t.metadataHelp,
            invalidMetadata: t.invalidMetadata,
          }}
        />
        <CommunicationPolicySummary
          policy={policy}
          labels={{
            title: t.summaryTitle,
            enabled: t.enabledValue,
            disabled: t.disabledValue,
            attachments: t.attachments,
            reactions: t.reactions,
            moderationMode: t.moderationMode,
            maxGroupMembers: t.maxGroupMembers,
            maxMessageLength: t.maxMessageLength,
            maxAttachmentSize: t.maxAttachmentSize,
            notSet: t.notSet,
          }}
        />
      </div>
    </div>
  );
}
