"use client";

import { useLocale } from "next-intl";
import { CheckCheck, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import NotificationDeliveryDetailsDrawer from "@/features/communication/components/notifications/NotificationDeliveryDetailsDrawer";
import NotificationDeliveryTable from "@/features/communication/components/notifications/NotificationDeliveryTable";
import NotificationDetailsDrawer from "@/features/communication/components/notifications/NotificationDetailsDrawer";
import NotificationFilters from "@/features/communication/components/notifications/NotificationFilters";
import NotificationList from "@/features/communication/components/notifications/NotificationList";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useNotificationDeliveries } from "@/features/communication/hooks/useNotificationDeliveries";
import { useNotificationDeliveryDetails } from "@/features/communication/hooks/useNotificationDeliveryDetails";
import { useNotificationDetails } from "@/features/communication/hooks/useNotificationDetails";
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
    sourceId: "Source",
    recipientUserId: "Recipient",
    selectSourceTypeFirst: "Select a source type first",
    createdFrom: "Created from",
    createdTo: "Created to",
    clear: "Clear",
    emptyTitle: "No notifications found",
    emptyDescription:
      "There are no notifications for this filter yet. New communication updates will appear here.",
    untitled: "Untitled notification",
    noBody: "No notification body.",
    type: "Type",
    viewDetails: "View details",
    notificationDetails: "Notification details",
    deliveryDetails: "Delivery details",
    close: "Close",
    advanced: "Advanced",
    metadata: "Metadata",
    source: "Source",
    recipient: "Recipient",
    provider: "Provider",
    errorMessage: "Error message",
    id: "ID",
    createdAt: "Created at",
    notificationTitle: "Title",
    body: "Body",
    deliveryStatus: "Delivery status",
    failedAt: "Failed",
    archivedAt: "Archived",
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
    readAt: "Read at",
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
    sourceId: "المصدر",
    recipientUserId: "المستلم",
    selectSourceTypeFirst: "اختر نوع المصدر أولاً",
    createdFrom: "أنشئت من",
    createdTo: "أنشئت إلى",
    clear: "مسح",
    emptyTitle: "لا توجد إشعارات",
    emptyDescription:
      "لا توجد إشعارات لهذا المرشح بعد. ستظهر تحديثات التواصل هنا.",
    untitled: "إشعار بدون عنوان",
    noBody: "لا يوجد محتوى للإشعار.",
    type: "النوع",
    viewDetails: "عرض التفاصيل",
    notificationDetails: "تفاصيل الإشعار",
    deliveryDetails: "تفاصيل التسليم",
    close: "إغلاق",
    advanced: "متقدم",
    metadata: "البيانات الإضافية",
    source: "المصدر",
    recipient: "المستلم",
    provider: "المزود",
    errorMessage: "رسالة الخطأ",
    id: "المعرف",
    createdAt: "تم الإنشاء في",
    notificationTitle: "العنوان",
    body: "المحتوى",
    deliveryStatus: "حالة التسليم",
    failedAt: "فشل في",
    archivedAt: "تمت الأرشفة",
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
    readAt: "تمت القراءة في",
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
  const notificationDetailsState = useNotificationDetails();
  const deliveryDetailsState = useNotificationDeliveryDetails();

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

  const handleDrawerMarkRead = async (notificationId: string) => {
    await handleMarkRead(notificationId);
    await notificationDetailsState.refresh().catch(() => undefined);
  };

  const handleDrawerArchive = async (notificationId: string) => {
    await handleArchive(notificationId);
    await notificationDetailsState.refresh().catch(() => undefined);
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
          selectSourceTypeFirst: t.selectSourceTypeFirst,
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
          viewDetails: t.viewDetails,
          archive: t.archive,
          markRead: t.markRead,
        }}
        isMutating={notificationsState.isMutating}
        onArchive={(notificationId) => void handleArchive(notificationId)}
        onMarkRead={(notificationId) => void handleMarkRead(notificationId)}
        onViewDetails={notificationDetailsState.open}
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
          viewDetails: t.viewDetails,
          emptyTitle: t.deliveriesEmptyTitle,
          emptyDescription: t.deliveriesEmptyDescription,
        }}
        onViewDetails={deliveryDetailsState.open}
      />
      <NotificationDetailsDrawer
        open={Boolean(notificationDetailsState.selectedNotificationId)}
        notification={notificationDetailsState.notification}
        isLoading={notificationDetailsState.isLoading}
        isMutating={notificationsState.isMutating}
        error={notificationDetailsState.error}
        onClose={notificationDetailsState.close}
        onMarkRead={(notificationId) => void handleDrawerMarkRead(notificationId)}
        onArchive={(notificationId) => void handleDrawerArchive(notificationId)}
        labels={{
          title: t.notificationDetails,
          close: t.close,
          markRead: t.markRead,
          archive: t.archive,
          loading: t.loading,
          errorTitle: t.errorTitle,
          id: t.id,
          notificationTitle: t.notificationTitle,
          body: t.body,
          type: t.type,
          status: t.status,
          priority: t.priority,
          sourceModule: t.sourceModule,
          sourceType: t.sourceType,
          sourceId: t.sourceId,
          recipientUserId: t.recipientUserId,
          createdAt: t.createdAt,
          readAt: t.readAt,
          archivedAt: t.archivedAt,
          advanced: t.advanced,
          metadata: t.metadata,
        }}
      />
      <NotificationDeliveryDetailsDrawer
        open={Boolean(deliveryDetailsState.selectedDeliveryId)}
        delivery={deliveryDetailsState.delivery}
        isLoading={deliveryDetailsState.isLoading}
        error={deliveryDetailsState.error}
        onClose={deliveryDetailsState.close}
        labels={{
          title: t.deliveryDetails,
          close: t.close,
          loading: t.loading,
          errorTitle: t.deliveriesErrorTitle,
          id: t.id,
          notificationId: t.notificationId,
          recipientUserId: t.recipientUserId,
          channel: t.channel,
          status: t.status,
          deliveryStatus: t.deliveryStatus,
          provider: t.provider,
          sentAt: t.sentAt,
          deliveredAt: t.deliveredAt,
          readAt: t.readAt,
          failedAt: t.failedAt,
          errorMessage: t.errorMessage,
          advanced: t.advanced,
          metadata: t.metadata,
        }}
      />
    </div>
  );
}
