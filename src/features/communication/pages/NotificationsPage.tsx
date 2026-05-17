"use client";

import { useLocale } from "next-intl";
import { CheckCheck, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import NotificationDeliveryTable from "@/features/communication/components/notifications/NotificationDeliveryTable";
import NotificationFilters from "@/features/communication/components/notifications/NotificationFilters";
import NotificationList from "@/features/communication/components/notifications/NotificationList";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useNotificationDeliveries } from "@/features/communication/hooks/useNotificationDeliveries";
import { useNotifications } from "@/features/communication/hooks/useNotifications";

const labels = {
  en: {
    title: "Notifications",
    description:
      "Review notification inbox items and delivery records across communication channels.",
    refresh: "Refresh",
    markAllRead: "Mark All Read",
    loading: "Loading notifications...",
    errorTitle: "Unable to load notifications",
    deliveriesErrorTitle: "Unable to load delivery records",
    retry: "Retry",
    status: "Status",
    all: "All",
    unread: "Unread",
    read: "Read",
    archived: "Archived",
    priority: "Priority",
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
    sourceModule: "Source module",
    sourceType: "Source type",
    sourceId: "Source ID",
    recipientUserId: "Recipient user ID",
    createdFrom: "Created from",
    createdTo: "Created to",
    clear: "Clear",
    emptyTitle: "No notifications found",
    emptyDescription:
      "There are no notifications for this filter yet. New communication updates will appear here.",
    untitled: "Untitled notification",
    noBody: "No notification body.",
    type: "Type",
    archive: "Archive",
    markRead: "Mark read",
    countLabel: "notification",
    countLabelPlural: "notifications",
    unreadLabel: "unread",
    deliveriesTitle: "Delivery Records",
    notificationId: "Notification",
    userId: "User",
    channel: "Channel",
    sentAt: "Sent",
    deliveredAt: "Delivered",
    readAt: "Read",
    deliveriesEmptyTitle: "No delivery records",
    deliveriesEmptyDescription:
      "Delivery records will appear when notifications are dispatched.",
    markedAllRead: "All notifications marked read.",
    markedRead: "Notification marked read.",
    archivedNotification: "Notification archived.",
    mutationFailed: "Action failed. Please try again.",
  },
  ar: {
    title: "الإشعارات",
    description: "راجع إشعارات التواصل وسجلات التسليم عبر القنوات.",
    refresh: "تحديث",
    markAllRead: "تعليم الكل كمقروء",
    loading: "جار تحميل الإشعارات...",
    errorTitle: "تعذر تحميل الإشعارات",
    deliveriesErrorTitle: "تعذر تحميل سجلات التسليم",
    retry: "إعادة المحاولة",
    status: "الحالة",
    all: "الكل",
    unread: "غير مقروء",
    read: "مقروء",
    archived: "مؤرشف",
    priority: "الأولوية",
    low: "منخفضة",
    normal: "عادية",
    high: "عالية",
    urgent: "عاجلة",
    sourceModule: "وحدة المصدر",
    sourceType: "نوع المصدر",
    sourceId: "معرف المصدر",
    recipientUserId: "معرف المستخدم المستلم",
    createdFrom: "أنشئت من",
    createdTo: "أنشئت إلى",
    clear: "مسح",
    emptyTitle: "لا توجد إشعارات",
    emptyDescription:
      "لا توجد إشعارات لهذا المرشح بعد. ستظهر تحديثات التواصل هنا.",
    untitled: "إشعار بدون عنوان",
    noBody: "لا يوجد محتوى للإشعار.",
    type: "النوع",
    archive: "أرشفة",
    markRead: "تعليم كمقروء",
    countLabel: "إشعار",
    countLabelPlural: "إشعارات",
    unreadLabel: "غير مقروء",
    deliveriesTitle: "سجلات التسليم",
    notificationId: "الإشعار",
    userId: "المستخدم",
    channel: "القناة",
    sentAt: "تم الإرسال",
    deliveredAt: "تم التسليم",
    readAt: "تمت القراءة",
    deliveriesEmptyTitle: "لا توجد سجلات تسليم",
    deliveriesEmptyDescription: "ستظهر سجلات التسليم عند إرسال الإشعارات.",
    markedAllRead: "تم تعليم كل الإشعارات كمقروءة.",
    markedRead: "تم تعليم الإشعار كمقروء.",
    archivedNotification: "تمت أرشفة الإشعار.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
  },
};

type LocaleKey = keyof typeof labels;

export default function NotificationsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const notificationsState = useNotifications();
  const deliveriesState = useNotificationDeliveries();

  const refreshAll = () => {
    void notificationsState.refresh();
    void deliveriesState.refresh();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsState.markAllRead();
      void deliveriesState.refresh();
      showSuccess(t.markedAllRead);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await notificationsState.markRead(notificationId);
      void deliveriesState.refresh();
      showSuccess(t.markedRead);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await notificationsState.archive(notificationId);
      void deliveriesState.refresh();
      showSuccess(t.archivedNotification);
    } catch {
      showError(t.mutationFailed);
    }
  };

  if (notificationsState.isLoading && deliveriesState.isLoading) {
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
              loading={
                notificationsState.isRefreshing || deliveriesState.isRefreshing
              }
              onClick={refreshAll}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
            <Button
              type="button"
              disabled={notificationsState.unreadCount === 0}
              loading={notificationsState.isMutating}
              onClick={() => void handleMarkAllRead()}
              leftIcon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
            >
              {t.markAllRead}
            </Button>
          </>
        }
      />
      <CommunicationTabs />

      <NotificationFilters
        filters={notificationsState.filters}
        onChange={notificationsState.setFilters}
        labels={{
          status: t.status,
          all: t.all,
          unread: t.unread,
          read: t.read,
          archived: t.archived,
          priority: t.priority,
          low: t.low,
          normal: t.normal,
          high: t.high,
          urgent: t.urgent,
          type: t.type,
          sourceModule: t.sourceModule,
          sourceType: t.sourceType,
          sourceId: t.sourceId,
          recipientUserId: t.recipientUserId,
          createdFrom: t.createdFrom,
          createdTo: t.createdTo,
          clear: t.clear,
        }}
      />

      {notificationsState.error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={notificationsState.error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void notificationsState.refresh()}
            >
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          {notificationsState.total}{" "}
          {notificationsState.total === 1 ? t.countLabel : t.countLabelPlural}
        </span>
        <span>
          {notificationsState.unreadCount} {t.unreadLabel}
        </span>
      </div>

      <NotificationList
        notifications={notificationsState.notifications}
        locale={locale}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          unread: t.unread,
          read: t.read,
          untitled: t.untitled,
          noBody: t.noBody,
          type: t.type,
          archive: t.archive,
          markRead: t.markRead,
        }}
        isMutating={notificationsState.isMutating}
        onArchive={(notificationId) => void handleArchive(notificationId)}
        onMarkRead={(notificationId) => void handleMarkRead(notificationId)}
      />

      {deliveriesState.error ? (
        <CommunicationErrorState
          title={t.deliveriesErrorTitle}
          message={deliveriesState.error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void deliveriesState.refresh()}
            >
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <NotificationDeliveryTable
        deliveries={deliveriesState.deliveries}
        labels={{
          title: t.deliveriesTitle,
          notificationId: t.notificationId,
          userId: t.userId,
          channel: t.channel,
          status: t.status,
          sentAt: t.sentAt,
          deliveredAt: t.deliveredAt,
          readAt: t.readAt,
          emptyTitle: t.deliveriesEmptyTitle,
          emptyDescription: t.deliveriesEmptyDescription,
        }}
      />
    </div>
  );
}
