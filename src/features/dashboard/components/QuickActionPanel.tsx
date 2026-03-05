"use client";

import {
  Send,
  ChevronDown,
  User,
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  Megaphone,
  FileText,
  Upload,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

const quickNotifications = [
  { id: "1", icon: "📢" },
  { id: "2", icon: "📢" },
];

export default function QuickActionPanel() {
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const t = useTranslations("quick_actions");

  const quickActions = [
    {
      id: "add_student",
      icon: UserPlus,
      label: t("add_student"),
      color: "#0ac5b2",
    },
    {
      id: "attendance",
      icon: ClipboardCheck,
      label: t("attendance"),
      color: "#D93030",
    },
    {
      id: "announcement",
      icon: Megaphone,
      label: t("announcement"),
      color: "#37A465",
    },
    {
      id: "assessment",
      icon: FileText,
      label: t("assessment"),
      color: "#025a6b",
    },
    {
      id: "import_data",
      icon: Upload,
      label: t("import_data"),
      color: "#CF5A32",
    },
    {
      id: "print_reports",
      icon: Printer,
      label: t("print_reports"),
      color: "#3C49BF",
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm h-full">
      <h3 className="text-base font-bold text-gray-900 mb-6">{t("title")}</h3>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-lg font-medium group hover:shadow-md hover:scale-105"
              style={{ backgroundColor: `${action.color}`, borderColor: action.color, borderWidth: 2 }}
            >
              <Icon
                className="w-4 h-4 transition-colors text-white"
              />
              <span
                className="text-sm font-black transition-colors text-white"
              >
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification Center */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          {t("notification_center")}
        </h4>

        {/* Role Selector */}
        <div className="relative mb-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full flex items-center gap-2 ps-10 pe-10 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">{t("select_role")}</option>
            <option value="students">{t("students")}</option>
            <option value="teachers">{t("teachers")}</option>
            <option value="parents">{t("parents")}</option>
            <option value="staff">{t("staff")}</option>
            <option value="all">{t("all")}</option>
          </select>
          <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Text Input */}
        <div className="relative mb-4">
          <textarea
            placeholder={t("text_here")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Send Button */}
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!message.trim() || !selectedRole}
        >
          <Send className="w-4 h-4" />
          {t("send_notification")}
        </button>
      </div>

      {/* Quick Notifications List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t("quick_notifications")}
        </h4>
        {quickNotifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm">{notification.icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {t("quick_notification")}
              </span>
            </div>
            <button className="p-1.5 rounded-md bg-primary text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
