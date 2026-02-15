// FILE: src/components/leads/ActivityLog.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Phone,
  MessageCircle,
  Mail,
  FileText,
  TrendingUp,
  Plus,
} from "lucide-react";
import { ActivityLogItem, ActivityType } from "@/types/leads";

interface ActivityLogProps {
  activities: ActivityLogItem[];
  onAddActivity: (type: ActivityType, message: string) => void;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  Call: <Phone className="w-4 h-4" />,
  WhatsApp: <MessageCircle className="w-4 h-4" />,
  Email: <Mail className="w-4 h-4" />,
  Note: <FileText className="w-4 h-4" />,
  StatusChange: <TrendingUp className="w-4 h-4" />,
};

const activityColors: Record<ActivityType, string> = {
  Call: "bg-blue-100 text-blue-700",
  WhatsApp: "bg-green-100 text-green-700",
  Email: "bg-purple-100 text-purple-700",
  Note: "bg-gray-100 text-gray-700",
  StatusChange: "bg-amber-100 text-amber-700",
};

export default function ActivityLog({
  activities,
  onAddActivity,
}: ActivityLogProps) {
  const t = useTranslations("admissions.activity_log");
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("Call");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onAddActivity(activityType, message);
      setMessage("");
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("title")}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("add_activity")}
        </button>
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("activity_type")}
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
            >
              <option value="Call">{t("types.call")}</option>
              <option value="WhatsApp">{t("types.whatsapp")}</option>
              <option value="Email">{t("types.email")}</option>
              <option value="Note">{t("types.note")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("message")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
              placeholder={t("message_placeholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("add_activity")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setMessage("");
              }}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t("no_activities")}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activityColors[activity.type]}`}
              >
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {t(`types.${activity.type.toLowerCase()}`)}
                  </p>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("by")} {activity.createdBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
