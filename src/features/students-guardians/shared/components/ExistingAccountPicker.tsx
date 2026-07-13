"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import type { SettingsUserRecord } from "@/features/settings/types";

interface ExistingAccountPickerProps {
  selectedUser: SettingsUserRecord | null;
  onSelect: (user: SettingsUserRecord) => void;
  onClear: () => void;
}

export default function ExistingAccountPicker({
  selectedUser,
  onSelect,
  onClear,
}: ExistingAccountPickerProps) {
  const t = useTranslations("students_guardians.account_linking");
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SettingsUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadFailed(false);
      void fetchSettingsUsers({ search: query, limit: 10, status: "active" })
        .then((response) => {
          if (!cancelled) setUsers(response.items);
        })
        .catch(() => {
          if (!cancelled) setLoadFailed(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {selectedUser.fullName}
          </p>
          <p className="truncate text-gray-600">
            {selectedUser.username || selectedUser.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 shrink-0 cursor-pointer rounded-lg px-3 font-medium text-primary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("actions.change")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {t("fields.search_users")}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search_placeholder")}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {loading && (
          <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
      {query.trim().length >= 2 && !loading && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {loadFailed ? (
            <p role="alert" className="p-3 text-sm text-red-700">
              {t("search_failed")}
            </p>
          ) : users.length === 0 ? (
            <p className="p-3 text-sm text-gray-600">{t("no_results")}</p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user)}
                className="block min-h-11 w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-start text-sm transition-colors last:border-b-0 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <span className="block font-medium text-gray-900">
                  {user.fullName}
                </span>
                <span className="block text-gray-600">
                  {user.username || user.email} {" · "}
                  {user.roleName || t("role_unavailable")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
