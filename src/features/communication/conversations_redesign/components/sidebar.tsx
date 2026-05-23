"use client";

import { Pin, Plus, RefreshCw, Search } from "lucide-react";
import { useLocale } from "next-intl";
import Input from "@/components/ui/input/Input";
import {
  labelsForLocale,
  type ConversationRedesignLabels,
} from "@/features/communication/conversations_redesign/labels";
import type {
  ConversationFiltersState,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import type { ConversationStatus } from "@/features/communication/types/conversation.types";

export type ConversationRedesignFilter =
  | "all"
  | "mine"
  | "unread"
  | "pinned"
  | "archived"
  | "closed";

export interface ConversationSidebarProps {
  conversations: ConversationListItemModel[];
  currentUserId?: string | null;
  selectedConversationId?: string | null;
  filter: ConversationRedesignFilter;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelect: (conversationId: string) => void;
  onFilterChange: (filter: ConversationRedesignFilter) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreateConversation: () => void;
  className?: string;
}

const filters: Array<{
  value: ConversationRedesignFilter;
  labelKey: "all" | "mine" | "unread" | "pinned" | "archived" | "closed";
}> = [
  { value: "all", labelKey: "all" },
  { value: "mine", labelKey: "mine" },
  { value: "unread", labelKey: "unread" },
  { value: "pinned", labelKey: "pinned" },
  { value: "archived", labelKey: "archived" },
  { value: "closed", labelKey: "closed" },
];

const statusByRedesignFilter: Partial<
  Record<ConversationRedesignFilter, ConversationStatus | "all">
> = {
  all: "all",
  archived: "archived",
  closed: "closed",
};

export function statusForRedesignFilter(
  filter: ConversationRedesignFilter,
): ConversationFiltersState["status"] {
  return (statusByRedesignFilter[filter] ??
    "all") as ConversationFiltersState["status"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function conversationTitle(
  conversation: ConversationListItemModel,
  labels: ConversationRedesignLabels,
) {
  return (
    conversation.titleEn ||
    conversation.title ||
    conversation.titleAr ||
    labels.untitledConversation
  );
}

function conversationAvatar(conversation: ConversationListItemModel) {
  const record = conversation as Record<string, unknown>;
  const avatar =
    stringValue(record.avatarUrl) ||
    stringValue(record.avatar) ||
    stringValue(record.imageUrl);
  return avatar;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatConversationTime(
  value: string | null | undefined,
  locale: string,
  labels: ConversationRedesignLabels,
) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  if (diffDays === 1) return labels.yesterday;
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function lastMessagePreview(
  conversation: ConversationListItemModel,
  labels: ReturnType<typeof labelsForLocale>,
) {
  if (!conversation.lastMessage) return labels.noMessagesYet;
  if (conversation.lastMessage.status === "deleted") return labels.messageDeleted;
  const body = conversation.lastMessage.body;
  if (!body) return labels.noMessagesYet;
  return conversation.lastMessage.senderName
    ? `${conversation.lastMessage.senderName}: ${body}`
    : body;
}

function rowMatchesFilter(
  conversation: ConversationListItemModel,
  filter: ConversationRedesignFilter,
  currentUserId?: string | null,
) {
  if (filter === "mine") return conversation.createdById === currentUserId;
  if (filter === "unread") return (conversation.unreadCount ?? 0) > 0;
  if (filter === "pinned") return Boolean(conversation.isPinned);
  return true;
}

export default function ConversationSidebar({
  className = "",
  conversations,
  currentUserId,
  filter,
  isLoading,
  isRefreshing,
  onCreateConversation,
  onFilterChange,
  onRefresh,
  onSearchChange,
  onSelect,
  search,
  selectedConversationId,
}: ConversationSidebarProps) {
  const locale = useLocale();
  const labels = labelsForLocale(locale);
  const visibleConversations = conversations.filter((conversation) =>
    rowMatchesFilter(conversation, filter, currentUserId),
  );

  return (
    <aside
      className={`flex h-full min-h-0 flex-col border-e border-slate-200 bg-white ${className}`}
    >
      <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-7 text-slate-950">
              {labels.conversations}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {labels.manageSchoolCommunication}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              aria-label={labels.refreshConversations}
            >
              <RefreshCw
                className={`h-[18px] w-[18px] ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onCreateConversation}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-hover"
              aria-label={labels.createConversation}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={labels.searchConversations}
            className="h-9 rounded-lg border-0 bg-slate-100 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
            leftIcon={<Search className="h-4 w-4" />}
            type="search"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition ${
                filter === item.value
                  ? "border-primary-200 bg-primary-50 text-primary"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary-200"
              }`}
            >
              {labels[item.labelKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            {labels.loadingConversations}
          </div>
        ) : null}

        {!isLoading && visibleConversations.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            {labels.noConversationsFound}
          </div>
        ) : null}

        {visibleConversations.map((conversation) => {
          const title = conversationTitle(conversation, labels);
          const avatar = conversationAvatar(conversation);
          const selected = selectedConversationId === conversation.id;
          const lastTime =
            conversation.lastMessage?.createdAt ||
            conversation.lastMessageAt ||
            conversation.updatedAt ||
            conversation.createdAt;
          const actor = isRecord(conversation.createdBy)
            ? conversation.createdBy
            : undefined;
          const online = Boolean(
            (conversation as Record<string, unknown>).isOnline ||
            actor?.isOnline,
          );

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`group flex min-h-[79px] w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-start transition ${
                selected
                  ? "border-s-4 border-s-primary bg-primary-50 ps-3"
                  : "bg-slate-50 hover:bg-white"
              }`}
            >
              <div
                className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-300 text-sm font-bold text-primary-900"
                style={
                  avatar
                    ? {
                        backgroundImage: `url("${avatar}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
                aria-hidden="true"
              >
                {!avatar ? initials(title) : null}
                {online ? (
                  <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {conversation.isPinned ? (
                    <Pin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : null}
                  <div className="truncate text-sm font-bold text-slate-950">
                    {title}
                  </div>
                </div>
                <p className="mt-1 truncate text-xs text-slate-600">
                  {lastMessagePreview(conversation, labels)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-xs text-slate-600">
                  {formatConversationTime(lastTime, locale, labels)}
                </span>
                {(conversation.unreadCount ?? 0) > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
