"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Edit3,
  Lock,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { getAvatarUrl } from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  conversationTypeLabel,
  getTitle,
  numberValue,
} from "@/features/communication/conversations_redesign/utils/formatters";

export default function ConversationHeader({
  conversation,
  isLoading,
  labels,
  onArchive,
  onBack,
  onClose,
  onEdit,
  onRefresh,
  onReopen,
  readOnly,
}: {
  conversation: Conversation | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  onArchive: () => void;
  onBack: () => void;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onReopen: () => void;
  readOnly: boolean;
}) {
  const title = conversation
    ? getTitle(labels, conversation)
    : labels.untitledConversation;
  const avatar = getAvatarUrl(conversation);
  const participantsCount =
    conversation?.participantsCount ??
    numberValue(
      (conversation as CommunicationRecord | null)?.participants_count,
    );
  const typeLabel = conversationTypeLabel(conversation?.type, labels);
  const status = conversation?.status;
  const canArchive = status === "active";
  const canClose = status === "active";
  const canReopen = status === "archived" || status === "closed";

  return (
    <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 md:hidden"
          aria-label={labels.backToConversations}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <Avatar avatarUrl={avatar} name={title} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-950">
              {isLoading ? labels.loading : title}
            </h2>
            {readOnly ? (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                <Lock className="h-3 w-3" />
                {labels.readOnly}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs capitalize text-slate-600">
            <span>{typeLabel}</span>
            {participantsCount ? (
              <>
                <span aria-hidden="true">{"\u2022"}</span>
                <span>
                  {participantsCount} {labels.participantsCount}
                </span>
              </>
            ) : null}
            {status && status !== "active" ? (
              <>
                <span aria-hidden="true">{"\u2022"}</span>
                <span className="font-medium text-amber-600">{status}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-slate-500">
        <button
          type="button"
          disabled
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary"
          aria-label={labels.searchMessages}
          title={labels.messageSearchUnavailable}
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary"
          aria-label={labels.refreshConversation}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <HeaderActionsMenu
          canArchive={canArchive}
          canClose={canClose}
          canReopen={canReopen}
          labels={labels}
          onArchive={onArchive}
          onClose={onClose}
          onEdit={onEdit}
          onReopen={onReopen}
        />
        <button
          type="button"
          onClick={onBack}
          className="hidden h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
          aria-label={labels.backToConversations}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function HeaderActionsMenu({
  canArchive,
  canClose,
  canReopen,
  labels,
  onArchive,
  onClose,
  onEdit,
  onReopen,
}: {
  canArchive: boolean;
  canClose: boolean;
  canReopen: boolean;
  labels: ConversationRedesignLabels;
  onArchive: () => void;
  onClose: () => void;
  onEdit: () => void;
  onReopen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary"
        aria-label={labels.moreActions}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <MenuButton
            icon={<Edit3 className="h-4 w-4" />}
            label={labels.editConversation}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          />
          {canReopen ? (
            <MenuButton
              icon={<RotateCcw className="h-4 w-4" />}
              label={labels.reopenConversation}
              onClick={() => {
                setOpen(false);
                onReopen();
              }}
            />
          ) : null}
          {canArchive ? (
            <MenuButton
              icon={<Archive className="h-4 w-4" />}
              label={labels.archiveConversation}
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
              variant="warning"
            />
          ) : null}
          {canClose ? (
            <MenuButton
              icon={<XCircle className="h-4 w-4" />}
              label={labels.closeConversation}
              onClick={() => {
                setOpen(false);
                onClose();
              }}
              variant="danger"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning" | "danger";
}) {
  const colorClass =
    variant === "danger"
      ? "text-rose-700 hover:bg-rose-50"
      : variant === "warning"
        ? "text-amber-700 hover:bg-amber-50"
        : "text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
