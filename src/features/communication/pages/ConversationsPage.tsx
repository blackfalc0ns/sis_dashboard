"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import ConversationFilters from "@/features/communication/components/conversations/ConversationFilters";
import ConversationList from "@/features/communication/components/conversations/ConversationList";
import CreateConversationDialog from "@/features/communication/components/conversations/CreateConversationDialog";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import {
  useConversations,
  type ConversationFormValues,
  type ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";

const labels = {
  en: {
    title: "Conversations",
    description:
      "Search, review, and manage communication threads across groups, classrooms, and direct conversations.",
    newConversation: "New Conversation",
    refresh: "Refresh",
    loading: "Loading conversations...",
    errorTitle: "Unable to load conversations",
    retry: "Retry",
    emptyTitle: "No conversations found",
    emptyDescription:
      "Create a conversation or adjust the filters to see communication threads here.",
    search: "Search",
    searchPlaceholder: "Search by title or participant",
    status: "Status",
    all: "All",
    active: "Active",
    closedStatus: "Closed",
    archived: "Archived",
    clear: "Clear",
    untitled: "Untitled conversation",
    deletedMessage: "Message deleted",
    noLastMessage: "No messages yet",
    unread: "Unread",
    edit: "Edit",
    close: "Close",
    reopen: "Reopen",
    archive: "Archive",
    pinned: "Pinned",
    createTitle: "Create Conversation",
    editTitle: "Edit Conversation",
    formTitle: "Title",
    type: "Type",
    formDescription: "Description",
    academicYearId: "Academic year ID",
    termId: "Term ID",
    stageId: "Stage ID",
    gradeId: "Grade ID",
    sectionId: "Section ID",
    classroomId: "Classroom ID",
    subjectId: "Subject ID",
    avatarFileId: "Avatar file ID",
    isReadOnly: "Read only conversation",
    isPinned: "Pinned conversation",
    metadata: "Metadata",
    metadataHelp: "Optional JSON object for backend-supported metadata.",
    group: "Group",
    classroom: "Classroom",
    direct: "Direct",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    titleRequired: "Enter a title.",
    invalidMetadata: "Metadata must be a valid JSON object.",
    created: "Conversation created.",
    updated: "Conversation updated.",
    closedDone: "Conversation closed.",
    reopened: "Conversation reopened.",
    archivedDone: "Conversation archived.",
    mutationFailed: "Action failed. Please try again.",
    countLabel: "conversation",
    countLabelPlural: "conversations",
  },
  ar: {
    title: "المحادثات",
    description:
      "ابحث وراجع وأدر محادثات التواصل للمجموعات والفصول والمحادثات المباشرة.",
    newConversation: "محادثة جديدة",
    refresh: "تحديث",
    loading: "جار تحميل المحادثات...",
    errorTitle: "تعذر تحميل المحادثات",
    retry: "إعادة المحاولة",
    emptyTitle: "لا توجد محادثات",
    emptyDescription:
      "أنشئ محادثة أو عدل عوامل التصفية لعرض محادثات التواصل هنا.",
    search: "بحث",
    searchPlaceholder: "ابحث بالعنوان أو المشارك",
    status: "الحالة",
    all: "الكل",
    active: "نشطة",
    closedStatus: "مغلقة",
    archived: "مؤرشفة",
    clear: "مسح",
    untitled: "محادثة بدون عنوان",
    deletedMessage: "تم حذف الرسالة",
    noLastMessage: "لا توجد رسائل بعد",
    unread: "غير مقروء",
    edit: "تعديل",
    close: "إغلاق",
    reopen: "إعادة فتح",
    archive: "أرشفة",
    pinned: "مثبتة",
    createTitle: "إنشاء محادثة",
    editTitle: "تعديل المحادثة",
    formTitle: "العنوان",
    type: "النوع",
    formDescription: "الوصف",
    academicYearId: "معرف العام الدراسي",
    termId: "معرف الفصل الدراسي",
    stageId: "معرف المرحلة",
    gradeId: "معرف الصف",
    sectionId: "معرف الشعبة",
    classroomId: "معرف الفصل",
    subjectId: "معرف المادة",
    avatarFileId: "معرف ملف الصورة",
    isReadOnly: "محادثة للقراءة فقط",
    isPinned: "محادثة مثبتة",
    metadata: "البيانات الإضافية",
    metadataHelp: "كائن JSON اختياري للبيانات التي تدعمها الخلفية.",
    group: "مجموعة",
    classroom: "فصل",
    direct: "مباشرة",
    cancel: "إلغاء",
    create: "إنشاء",
    save: "حفظ",
    titleRequired: "أدخل عنوانا.",
    invalidMetadata: "يجب أن تكون البيانات الإضافية كائن JSON صالحا.",
    created: "تم إنشاء المحادثة.",
    updated: "تم تحديث المحادثة.",
    closedDone: "تم إغلاق المحادثة.",
    reopened: "تمت إعادة فتح المحادثة.",
    archivedDone: "تمت أرشفة المحادثة.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
    countLabel: "محادثة",
    countLabelPlural: "محادثات",
  },
};

type LocaleKey = keyof typeof labels;

export default function ConversationsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    archive,
    close,
    conversations,
    create,
    error,
    filters,
    isLoading,
    isMutating,
    isRefreshing,
    refresh,
    reopen,
    setFilters,
    total,
    update,
  } = useConversations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConversation, setEditingConversation] =
    useState<ConversationListItemModel | null>(null);

  const openCreateDialog = () => {
    setEditingConversation(null);
    setDialogOpen(true);
  };

  const openEditDialog = (conversation: ConversationListItemModel) => {
    setEditingConversation(conversation);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ConversationFormValues) => {
    try {
      if (editingConversation) {
        await update(editingConversation.id, values);
        showSuccess(t.updated);
      } else {
        await create(values);
        showSuccess(t.created);
      }
      setDialogOpen(false);
      setEditingConversation(null);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const runMutation = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      await action();
      showSuccess(successMessage);
    } catch {
      showError(t.mutationFailed);
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
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh()}
              loading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
            <Button
              type="button"
              onClick={openCreateDialog}
              leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {t.newConversation}
            </Button>
          </>
        }
      />
      <CommunicationTabs />

      <ConversationFilters
        filters={filters}
        onChange={setFilters}
        labels={{
          search: t.search,
          searchPlaceholder: t.searchPlaceholder,
          status: t.status,
          all: t.all,
          active: t.active,
          closed: t.closedStatus,
          archived: t.archived,
          clear: t.clear,
        }}
      />

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

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {total} {total === 1 ? t.countLabel : t.countLabelPlural}
        </span>
      </div>

      <ConversationList
        conversations={conversations}
        disabled={isMutating}
        emptyTitle={t.emptyTitle}
        emptyDescription={t.emptyDescription}
        labels={{
          untitled: t.untitled,
          deletedMessage: t.deletedMessage,
          noLastMessage: t.noLastMessage,
          unread: t.unread,
          edit: t.edit,
          close: t.close,
          reopen: t.reopen,
          archive: t.archive,
          pinned: t.pinned,
        }}
        onEdit={openEditDialog}
        onClose={(conversationId) =>
          void runMutation(() => close(conversationId), t.closedDone)
        }
        onReopen={(conversationId) =>
          void runMutation(() => reopen(conversationId), t.reopened)
        }
        onArchive={(conversationId) =>
          void runMutation(() => archive(conversationId), t.archivedDone)
        }
      />

      {dialogOpen ? (
        <CreateConversationDialog
          key={editingConversation?.id ?? "create-conversation"}
          open={dialogOpen}
          conversation={editingConversation}
          isSubmitting={isMutating}
          onClose={() => {
            setDialogOpen(false);
            setEditingConversation(null);
          }}
          onSubmit={handleSubmit}
          labels={{
            createTitle: t.createTitle,
            editTitle: t.editTitle,
            title: t.formTitle,
            type: t.type,
            description: t.formDescription,
            academicYearId: t.academicYearId,
            termId: t.termId,
            stageId: t.stageId,
            gradeId: t.gradeId,
            sectionId: t.sectionId,
            classroomId: t.classroomId,
            subjectId: t.subjectId,
            avatarFileId: t.avatarFileId,
            isReadOnly: t.isReadOnly,
            isPinned: t.isPinned,
            metadata: t.metadata,
            metadataHelp: t.metadataHelp,
            group: t.group,
            classroom: t.classroom,
            direct: t.direct,
            cancel: t.cancel,
            create: t.create,
            save: t.save,
            titleRequired: t.titleRequired,
            invalidMetadata: t.invalidMetadata,
          }}
        />
      ) : null}
    </div>
  );
}
