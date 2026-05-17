"use client";

import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { NotificationDelivery } from "@/features/communication/types/notification.types";

export interface NotificationDeliveryTableLabels {
  title: string;
  notificationId: string;
  userId: string;
  channel: string;
  status: string;
  sentAt: string;
  deliveredAt: string;
  readAt: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface NotificationDeliveryTableProps {
  deliveries: NotificationDelivery[];
  labels: NotificationDeliveryTableLabels;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "delivered" || status === "read") return "success" as const;
  if (status === "failed") return "error" as const;
  if (status === "sent") return "info" as const;
  return "warning" as const;
}

export default function NotificationDeliveryTable({
  deliveries,
  labels,
}: NotificationDeliveryTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        {labels.title}
      </h2>
      {deliveries.length === 0 ? (
        <CommunicationEmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.notificationId}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.userId}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.channel}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.status}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.sentAt}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.deliveredAt}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.readAt}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-slate-50">
                  <td className="max-w-44 truncate px-3 py-3 text-slate-700">
                    {delivery.notificationId ?? "-"}
                  </td>
                  <td className="max-w-44 truncate px-3 py-3 text-slate-700">
                    {delivery.userId ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {delivery.channel ?? "-"}
                  </td>
                  <td className="px-3 py-3">
                    <CommunicationStatusChip
                      label={delivery.status ?? "-"}
                      tone={statusTone(delivery.status)}
                    />
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(delivery.sentAt)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(delivery.deliveredAt)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(delivery.readAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
