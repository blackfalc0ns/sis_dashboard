"use client";

import {
  Lock,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
  MessageCircle,
  BookOpen,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import Input from "@/components/ui/input/Input";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
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
  typeFilter: string;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelect: (conversationId: string) => void;
  onFilterChange: (filter: ConversationRedesignFilter) => void;
  onTypeFilterChange: (type: string) => void;
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

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  return (
    stringValue(record.avatarUrl) ||
    stringValue(record.avatar) ||
    stringValue(record.imageUrl)
  );
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
  if (conversation.lastMessage.status === "deleted")
    return labels.messageDeleted;
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
  typeFilter?: string,
) {
  if (typeFilter && conversation.type !== typeFilter) return false;
  if (filter === "mine") return conversation.createdById === currentUserId;
  if (filter === "unread") return (conversation.unreadCount ?? 0) > 0;
  if (filter === "pinned") return Boolean(conversation.isPinned);
  return true;
}

function ConversationTypeBadge({
  type,
  labels,
}: {
  type?: string;
  labels: ConversationRedesignLabels;
}) {
  const config: Record<
    string,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    direct: {
      icon: <MessageCircle className="h-2.5 w-2.5" />,
      label: labels.direct,
      color: "text-sky-400",
    },
    group: {
      icon: <Users className="h-2.5 w-2.5" />,
      label: labels.group,
      color: " text-violet-400",
    },
    classroom: {
      icon: <BookOpen className="h-2.5 w-2.5" />,
      label: labels.classType,
      color: "text-amber-400",
    },
  };

  const entry = config[type ?? ""] ?? {
    icon: <MessageCircle className="h-2.5 w-2.5" />,
    label: type ?? labels.direct,
    color: "text-black-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold tracking-wide ${entry.color}`}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}

function TypeFilterTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-white shadow-sm shadow-primary/30"
          : "text-black-400 hover:bg-white/5 hover:text-black-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}



export default function ConversationSidebar({
  className = "",
  conversations,
  currentUserId,
  filter,
  typeFilter,
  isLoading,
  isRefreshing,
  onCreateConversation,
  onFilterChange,
  onTypeFilterChange,
  onRefresh,
  onSearchChange,
  onSelect,
  search,
  selectedConversationId,
}: ConversationSidebarProps) {
  const locale = useLocale();
  const labels = labelsForLocale(locale);

  const typeTabs = [
    { value: "", icon: <MessageCircle className="h-3.5 w-3.5" />, label: labels.all },
    {
      value: "direct",
      icon: <MessageCircle className="h-3.5 w-3.5" />,
      label: labels.direct,
    },
    { value: "group", icon: <Users className="h-3.5 w-3.5" />, label: labels.group },
    {
      value: "classroom",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      label: labels.classType,
    },
  ];

  const visibleConversations = conversations.filter((c) =>
    rowMatchesFilter(c, filter, currentUserId, typeFilter),
  );

  const pinnedConversations = visibleConversations.filter((c) => c.isPinned);
  const unpinnedConversations = visibleConversations.filter((c) => !c.isPinned);

  return (
    <aside
      className={`flex h-full min-h-0 flex-col border-e border-white/[0.06] bg-white ${className}`}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/[0.06] px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-black">
              {labels.conversations}
            </h1>
            <p className="mt-0.5 text-[11px] text-black-500">
              {visibleConversations.length > 0
                ? labels.nConversations.replace("{n}", String(visibleConversations.length))
                : labels.manageSchoolCommunication}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              aria-label={labels.refreshConversations}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-black-500 transition-all duration-200 hover:bg-white/[0.06] hover:text-black-300"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onCreateConversation}
              aria-label={labels.createConversation}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black-500" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchConversations}
            type="search"
            variant="default"
            className="h-9 w-full rounded-lg border border-primary bg-white/[0.04] ps-9 pe-4 text-sm text-black-200 placeholder:text-black-600 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
          {typeTabs.map((tab) => (
            <TypeFilterTab
              key={tab.value}
              active={typeFilter === tab.value}
              onClick={() => onTypeFilterChange(tab.value)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>

        {/* Status filter pills */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={`h-8 shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-medium tracking-wide transition-all duration-200 ${
                filter === item.value
                  ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
              }`}
            >
              {labels[item.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-white/[0.04] px-4 py-3"
              >
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <MessageCircle className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              {labels.noConversationsFound}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinnedConversations.length > 0 && (
              <>
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-4 py-2 backdrop-blur-sm">
                  <Pin className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">
                    {labels.pinned}
                  </span>
                </div>
                {pinnedConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedConversationId === c.id}
                    locale={locale}
                    labels={labels}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}

            {/* All others */}
            {unpinnedConversations.length > 0 && (
              <>
                {pinnedConversations.length > 0 && (
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-4 py-2 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      {labels.recent}
                    </span>
                  </div>
                )}
                {unpinnedConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedConversationId === c.id}
                    locale={locale}
                    labels={labels}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function ConversationRow({
  conversation,
  selected,
  locale,
  labels,
  onSelect,
}: {
  conversation: ConversationListItemModel;
  selected: boolean;
  locale: string;
  labels: ReturnType<typeof labelsForLocale>;
  onSelect: (id: string) => void;
}) {
  const record = conversation as Record<string, unknown>;
  const title = conversationTitle(conversation, labels);
  const avatar = conversationAvatar(conversation);
  const lastTime =
    conversation.lastMessage?.createdAt ||
    (record.lastMessageAt as string | undefined) ||
    conversation.updatedAt ||
    conversation.createdAt;
  const preview = lastMessagePreview(conversation, labels);
  const unread = conversation.unreadCount ?? 0;
  const participantCount =
    (record.activeParticipantsCount as number | undefined) ??
    (record.participantsCount as number | undefined) ??
    (record.participantCount as number | undefined);
  const isReadOnly = Boolean(record.isReadOnly);
  const isOfficial = Boolean(record.isOfficial);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-start transition-all duration-150 ${
        selected
          ? "border-b-white/[0.06] border-s-2 border-s-primary bg-primary/[0.08] ps-[14px]"
          : "border-b-white/[0.04] border-s-2 border-s-transparent hover:bg-white/[0.03]"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar
          avatarUrl={avatar}
          fileId={stringValue(record.avatarFileId)}
          name={title}
          size="md"
        />
        {/* Online dot placeholder — kept for future presence support */}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Row 1: title + badges + time */}
        <div className="flex items-center gap-1.5">
          <span
            data-testid="conversation-title"
            className={`truncate text-sm font-semibold leading-5 ${
              selected ? "text-primary" : "text-black-200"
            } ${unread > 0 ? "text-primary" : ""}`}
          >
            {title}
          </span>
          <ConversationTypeBadge type={conversation.type} labels={labels} />
          {isOfficial && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              <Shield className="h-2.5 w-2.5" />
              {labels.official}
            </span>
          )}
          {isReadOnly && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-500/20">
              <Lock className="h-2.5 w-2.5" />
              {labels.readOnlyBadge}
            </span>
          )}
          <span className="ms-auto shrink-0 text-[11px] text-slate-600">
            {formatConversationTime(lastTime, locale, labels)}
          </span>
        </div>

        {/* Row 2: last message preview + participant count + unread badge */}
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`flex-1 truncate text-[11px] leading-4 ${
              unread > 0 ? "font-medium text-slate-300" : "text-slate-500"
            }`}
          >
            {preview}
          </p>
          {participantCount !== undefined && participantCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-600">
              <Users className="h-2.5 w-2.5" />
              {participantCount}
            </span>
          )}
          {unread > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm shadow-primary/30">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
