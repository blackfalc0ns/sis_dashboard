"use client";

import { Bell, Clock3, ShieldAlert, Workflow } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { NedaaTimelineEvent } from "@/features/nedaa/types/nedaa";
import { getNedaaTimelineLabelKey } from "@/features/nedaa/utils/nedaaPresentation";
import { formatDateTime } from "@/utils/formatters/dateTime";

function getTimelineIcon(type: NedaaTimelineEvent["type"]) {
  switch (type) {
    case "notification_sent":
    case "notification_skipped":
      return Bell;
    case "unauthorized_attempt":
      return ShieldAlert;
    case "status_changed":
      return Workflow;
    default:
      return Clock3;
  }
}

export default function NedaaTimeline({
  events,
}: {
  events: NedaaTimelineEvent[];
}) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
        {t("history.no_timeline")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("history.timeline")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("history.timeline_subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {events
          .slice()
          .sort(
            (left, right) =>
              new Date(right.timestamp).getTime() -
              new Date(left.timestamp).getTime(),
          )
          .map((event) => {
            const Icon = getTimelineIcon(event.type);

            return (
              <div
                key={event.id}
                className="flex gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-gray-900">
                      {t(getNedaaTimelineLabelKey(event))}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(event.timestamp, locale)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{event.actor}</p>
                  {event.note ? (
                    <p className="mt-2 text-sm text-gray-500">
                      {t(`timeline_notes.${event.note}`)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
