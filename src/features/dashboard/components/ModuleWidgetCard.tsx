"use client";

import type { LucideIcon } from "lucide-react";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  School,
  Settings2,
  Info,
} from "lucide-react";
import type { DashboardWidget } from "../types/dashboardApi.types";

const widgetIcons: Record<string, LucideIcon> = {
  users: Users,
  "graduation-cap": GraduationCap,
  calendar: Calendar,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  "list-todo": ListTodo,
  admissions: Users,
  academics: GraduationCap,
  attendance: CheckCircle2,
  grades: BookOpen,
  homework: BookOpen,
  behavior: ShieldAlert,
  reinforcement: School,
  settings: Settings2,
};

const toneStyles: Record<
  string,
  { border: string; bg: string; text: string; icon: string; dot: string; progressBg: string }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    dot: "bg-red-500",
    progressBg: "bg-red-500",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    dot: "bg-amber-500",
    progressBg: "bg-amber-500",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    icon: "text-cyan-600",
    dot: "bg-cyan-500",
    progressBg: "bg-cyan-500",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    dot: "bg-emerald-500",
    progressBg: "bg-emerald-500",
  },
  neutral: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    dot: "bg-gray-400",
    progressBg: "bg-gray-500",
  },
};

interface ModuleWidgetCardProps {
  widget: DashboardWidget;
}

export default function ModuleWidgetCard({ widget }: ModuleWidgetCardProps) {
  const Icon = widgetIcons[widget.iconKey] || Info;
  const toneStyle = toneStyles[widget.tone] || toneStyles.neutral;

  switch (widget.type) {
    case "stat-card": {
      const val = widget.data?.value ?? "--";
      return (
        <article className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider truncate">
                {widget.title}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-950 truncate">
                {val}
              </p>
              {widget.subtitle && (
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {widget.subtitle}
                </p>
              )}
            </div>
            <div className={`rounded-full border ${toneStyle.border} ${toneStyle.bg} p-2 shrink-0`}>
              <Icon className={`h-4 w-4 ${toneStyle.icon}`} />
            </div>
          </div>
        </article>
      );
    }

    case "progress-card": {
      const data = widget.data || {};
      const percent = data.percent ?? 0;
      const label = data.label ?? "";
      const segments = data.segments || [];

      return (
        <article className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider truncate">
              {widget.title}
            </p>
            <span className="text-sm font-bold text-gray-950">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 flex">
            {segments.length > 0 ? (
              segments.map((seg: { key: string; value: number; label: string }) => (
                <div
                  key={seg.key}
                  style={{ width: `${(seg.value / (data.max || 100)) * 100}%` }}
                  className={`h-full ${toneStyles[seg.key]?.progressBg || toneStyle.progressBg}`}
                  title={`${seg.label}: ${seg.value}`}
                />
              ))
            ) : (
              <div
                style={{ width: `${percent}%` }}
                className={`h-full ${toneStyle.progressBg}`}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-gray-600">{label || widget.subtitle}</p>
        </article>
      );
    }

    case "todo-card": {
      const data = widget.data || {};
      const items = data.items || [];
      const summary = data.summary || { total: 0, pending: 0, completed: 0 };

      return (
        <article className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary-500" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {widget.title}
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {summary.completed}/{summary.total} Done
            </span>
          </div>
          <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
            {items.map((item: { title: string; status: string; priority?: string }, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2 text-xs text-gray-700"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    item.status === "completed"
                      ? "bg-emerald-500"
                      : item.priority === "high"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <span className={item.status === "completed" ? "line-through text-gray-400 truncate flex-1" : "truncate flex-1"}>
                  {item.title}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                No tasks available
              </p>
            )}
          </div>
        </article>
      );
    }

    case "calendar-card":
    case "timeline-card": {
      const data = widget.data || {};
      const events = data.events || [];

      return (
        <article className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {widget.title}
              </p>
            </div>
          </div>
          <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
            {events.map((event: { title: string; date: string; startTime?: string; iconKey: string; tone: string }, idx: number) => {
              const EventIcon = widgetIcons[event.iconKey] || Clock;
              const evToneStyle = toneStyles[event.tone] || toneStyle;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg bg-gray-50 p-2 text-xs text-gray-700"
                >
                  <div className={`rounded-full ${evToneStyle.bg} p-1 shrink-0`}>
                    <EventIcon className={`h-3.5 w-3.5 ${evToneStyle.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{event.title}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {event.date} {event.startTime ? `• ${event.startTime}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                No events scheduled
              </p>
            )}
          </div>
        </article>
      );
    }

    default: {
      return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200">
          <p className="text-xs font-semibold text-gray-600 uppercase">{widget.title}</p>
          <p className="mt-1 text-xs text-gray-600">{widget.subtitle}</p>
        </article>
      );
    }
  }
}
