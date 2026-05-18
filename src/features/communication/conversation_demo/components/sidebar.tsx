"use client";

import {
  Pin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type {
  ConversationFiltersState,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import type { ConversationStatus } from "@/features/communication/types/conversation.types";

export type ConversationDemoFilter =
  | "all"
  | "unread"
  | "pinned"
  | "archived"
  | "closed";

export interface ConversationSidebarProps {
  conversations: ConversationListItemModel[];
  selectedConversationId?: string | null;
  filter: ConversationDemoFilter;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelect: (conversationId: string) => void;
  onFilterChange: (filter: ConversationDemoFilter) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreateConversation: () => void;
  className?: string;
}

const filters: Array<{ value: ConversationDemoFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "pinned", label: "Pinned" },
  { value: "archived", label: "Archived" },
  { value: "closed", label: "Closed" },
];

const statusByDemoFilter: Partial<
  Record<ConversationDemoFilter, ConversationStatus | "all">
> = {
  all: "all",
  archived: "archived",
  closed: "closed",
};

export function statusForDemoFilter(
  filter: ConversationDemoFilter,
): ConversationFiltersState["status"] {
  return (statusByDemoFilter[filter] ?? "all") as ConversationFiltersState["status"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function conversationTitle(conversation: ConversationListItemModel) {
  return (
    conversation.titleEn ||
    conversation.title ||
    conversation.titleAr ||
    "Untitled conversation"
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

function formatConversationTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function lastMessagePreview(conversation: ConversationListItemModel) {
  if (conversation.lastMessage?.status === "deleted") return "Message deleted";
  const body =
    conversation.lastMessage?.body ||
    stringValue((conversation as Record<string, unknown>).description) ||
    "No messages yet.";
  return conversation.lastMessage?.senderName
    ? `${conversation.lastMessage.senderName}: ${body}`
    : body;
}

function rowMatchesFilter(
  conversation: ConversationListItemModel,
  filter: ConversationDemoFilter,
) {
  if (filter === "unread") return (conversation.unreadCount ?? 0) > 0;
  if (filter === "pinned") return Boolean(conversation.isPinned);
  return true;
}

export default function ConversationSidebar({
  className = "",
  conversations,
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
  const visibleConversations = conversations.filter((conversation) =>
    rowMatchesFilter(conversation, filter),
  );

  return (
    <aside
      className={`flex h-full min-h-0 flex-col border-r border-slate-200 bg-white ${className}`}
    >
      <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-7 text-slate-950">
              Conversations
            </h1>
            <p className="mt-1 text-xs text-[#365a85]">
              Manage school communication
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6e87aa] transition hover:bg-slate-100 hover:text-[#0288d1]"
              aria-label="Refresh conversations"
            >
              <RefreshCw
                className={`h-[18px] w-[18px] ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onCreateConversation}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0288d1] text-white shadow-sm transition hover:bg-[#0277bd]"
              aria-label="Create conversation"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bf]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations..."
            className="h-9 w-full rounded-lg border-0 bg-[#f0f4f8] pl-9 pr-3 text-sm text-slate-800 placeholder:text-[#6e87aa] focus:outline-none focus:ring-2 focus:ring-[#bfe5fb]"
            type="search"
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition ${
                filter === item.value
                  ? "border-[#8ad5fb] bg-[#dff4ff] text-[#0277bd]"
                  : "border-slate-200 bg-white text-[#123156] hover:border-[#b9d7ea]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc]">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-[#6e87aa]">
            Loading conversations...
          </div>
        ) : null}

        {!isLoading && visibleConversations.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[#6e87aa]">
            No conversations found.
          </div>
        ) : null}

        {visibleConversations.map((conversation) => {
          const title = conversationTitle(conversation);
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
              className={`group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                selected
                  ? "border-l-4 border-l-[#0288d1] bg-[#eaf7ff] pl-3"
                  : "bg-[#f8fafc] hover:bg-white"
              }`}
            >
              <div
                className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d9edf8] to-[#7cb9dd] text-sm font-bold text-[#014d75]"
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
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#00b86b]" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {conversation.isPinned ? (
                    <Pin className="h-3.5 w-3.5 shrink-0 text-[#8aa0bf]" />
                  ) : null}
                  <div className="truncate text-sm font-bold text-slate-950">
                    {title}
                  </div>
                </div>
                <p className="mt-1 truncate text-xs text-[#365a85]">
                  {lastMessagePreview(conversation)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-xs text-[#365a85]">
                  {formatConversationTime(lastTime)}
                </span>
                {(conversation.unreadCount ?? 0) > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0288d1] px-1.5 text-[11px] font-bold text-white">
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
